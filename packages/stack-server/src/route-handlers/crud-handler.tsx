import "../polyfills";

import { NextRequest } from "next/server";
import * as yup from "yup";
import { routeHandlerTypeHelper, smartRouteHandler } from "./smart-route-handler";
import { CrudOperation, CrudSchema, CrudTypeOf } from "@stackframe/stack-shared/dist/crud";
import { DeepPartial, FilterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { outerProduct, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { MergeSmartRequest, SmartRequest } from "./smart-request";
import { SmartResponse } from "./smart-response";

type GetAdminKey<T extends CrudTypeOf<any>, K extends Capitalize<CrudOperation>> = K extends (keyof T["Admin"] & Exclude<Capitalize<CrudOperation>, "Read">) ? T["Admin"][K] : void;

type CrudSingleRouteHandler<T extends CrudTypeOf<any>, K extends Capitalize<CrudOperation>> =
  K extends keyof T["Admin"] ? (data: GetAdminKey<T, K>) => Promise<K extends "Delete" ? void : GetAdminKey<T, "Read">> : void;

type CrudRouteHandlersUnfiltered<T extends CrudTypeOf<any>> = {
  onCreate: CrudSingleRouteHandler<T, "Create">,
  onRead: CrudSingleRouteHandler<T, "Read">,
  onUpdate: CrudSingleRouteHandler<T, "Update">,
  onDelete: CrudSingleRouteHandler<T, "Delete">,
};

type CrudRouteHandlers<T extends CrudTypeOf<any>> = FilterUndefined<CrudRouteHandlersUnfiltered<T>>;

export function crudHandler<S extends CrudSchema>(crud: S, handlers: CrudRouteHandlers<CrudTypeOf<S>>): (req: NextRequest, options: any) => Promise<Response> {
  const operations = [
    ["GET", "Read"],
    ["POST", "Create"],
    ["PUT", "Update"],
    ["DELETE", "Delete"],
  ] as const;
  const accessTypes = ["client", "server", "admin"] as const;
  const allowedCombinations = outerProduct(operations, accessTypes)
    .filter(([[httpMethod, crudOperation], accessType]) => {
      const handler = crud[accessType][`${typedToLowercase(crudOperation)}Schema`];
      return handler !== undefined;
    });

  return smartRouteHandler(
    allowedCombinations,
    ([[httpMethod, crudOperation], accessType]) => {
      const frw = routeHandlerTypeHelper({
        request: yup.object({
          auth: yup.object({
            type: yup.string().oneOf([accessType]).required(),
          }).required(),
          url: yup.string().required(),
          method: yup.string().oneOf([httpMethod]).required(),
          body: typedIncludes(["Create", "Update", "Delete"], crudOperation)
            ? crud[accessType][`${typedToLowercase(crudOperation)}Schema`] ?? throwErr(`No schema for ${crudOperation}; this should never happen`)
            : yup.mixed().oneOf([undefined]),
        }),
        response: yup.object({
          statusCode: yup.number().oneOf([200, 201]).required(),
          headers: yup.object().shape({
            location: yup.array(yup.string().required()).optional(),
          }),
          bodyType: yup.string().oneOf(["json"]).required(),
          body: (crud[accessType].readSchema ?? yup.mixed().oneOf([undefined])).optional(),
        }),
        handler: async (req) => {
          const adminSchema = crudOperation === "Read" ? undefined : crud.admin[`${typedToLowercase(crudOperation)}Schema`];
          const adminReadSchema = crud.admin.readSchema;
          const accessReadSchema = crud[accessType].readSchema;
          if (!adminSchema || !adminReadSchema || !accessReadSchema) {
            throw new StackAssertionError(`Schema not available for ${crudOperation}; this should never happen`);
          }

          const handlersUnfiltered: Partial<CrudRouteHandlersUnfiltered<CrudTypeOf<S>>> = handlers;
          const data = req.body;
          const adminData = adminSchema ? await validate(data, adminSchema, true) : undefined;
          const result = await handlersUnfiltered[`on${crudOperation}`]?.(adminData);
          const resultAdminValidated = crudOperation === "Delete" ? undefined : await validate(result, adminReadSchema, false);
          const resultAccessValidated = crudOperation === "Delete" ? undefined : await validate(resultAdminValidated, accessReadSchema, false);

          return {
            statusCode: crudOperation === "Create" ? 201 : 200,
            headers: {
              location: crudOperation === "Create" ? [req.url] : undefined,
            },
            bodyType: "json",
            body: resultAccessValidated,
          };
        },
      });
      return frw;
    }
  );
}

async function validate<T>(obj: unknown, schema: yup.Schema<T>, cast: boolean): Promise<T> {
  try {
    return await schema.validate(obj, {
      abortEarly: false,
      stripUnknown: true,
      strict: !cast,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new StackAssertionError(`CRUD handler validation failed. This indicates a bug in the code. Errors:\n\n${error.errors.join("\n\n")}`, undefined, { cause: error });
    }
    throw error;
  }
}
