import "../polyfills";

import { NextRequest } from "next/server";
import * as yup from "yup";
import { routeHandlerTypeHelper, smartRouteHandler } from "./smart-route-handler";
import { CrudOperation, CrudSchema, CrudTypeOf } from "@stackframe/stack-shared/dist/crud";
import { FilterUndefined, typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import { outerProduct, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";

type GetAdminKey<T extends CrudTypeOf<any>, K extends Capitalize<CrudOperation>> = K extends (keyof T["Admin"] & Exclude<Capitalize<CrudOperation>, "Read">) ? T["Admin"][K] : void;

type CrudSingleRouteHandler<T extends CrudTypeOf<any>, K extends Capitalize<CrudOperation>, Params extends {}, Multi extends boolean = false> =
  K extends keyof T["Admin"]
    ? (params: Params, data: GetAdminKey<T, K>) => Promise<
      K extends "Delete"
        ? void
        : (
          Multi extends true
            ? GetAdminKey<T, "Read">[]
            : GetAdminKey<T, "Read">
        )
    >
    : void;

type CrudRouteHandlersUnfiltered<T extends CrudTypeOf<any>, Params extends {}> = {
  onCreate: CrudSingleRouteHandler<T, "Create", Params>,
  onRead: CrudSingleRouteHandler<T, "Read", Params>,
  onList: keyof Params extends never ? void : CrudSingleRouteHandler<T, "Read", Partial<Params>, true>,
  onUpdate: CrudSingleRouteHandler<T, "Update", Params>,
  onDelete: CrudSingleRouteHandler<T, "Delete", Params>,
};

type CrudHandlerOptions<T extends CrudTypeOf<any>, ParamNames extends string> =
  & FilterUndefined<CrudRouteHandlersUnfiltered<T, Record<ParamNames, string>>>
  & {
    paramNames: ParamNames[],
  };


type SingleCrudHandler = (
  req: NextRequest,
  options: { params: any },
) => Promise<Response>;

type CrudHandlers<O extends {}> = {
  createHandler: "onCreate" extends keyof O ? SingleCrudHandler : void,
  readHandler: "onRead" extends keyof O ? SingleCrudHandler : void,
  listHandler: "onList" extends keyof O ? SingleCrudHandler : void,
  updateHandler: "onUpdate" extends keyof O ? SingleCrudHandler : void,
  deleteHandler: "onDelete" extends keyof O ? SingleCrudHandler : void,
};

export function createCrudHandlers<S extends CrudSchema, O extends CrudHandlerOptions<CrudTypeOf<S>, any>>(crud: S, options: O): CrudHandlers<O> {
  const operations = [
    ["GET", "Read"],
    ["GET", "List"],
    ["POST", "Create"],
    ["PUT", "Update"],
    ["DELETE", "Delete"],
  ] as const;
  const accessTypes = ["client", "server", "admin"] as const;

  const paramsSchema = yup.object(Object.fromEntries(
    options.paramNames.map((paramName) => [paramName, yup.string().required()])
  ));

  return Object.fromEntries(operations.map(([httpMethod, crudOperation]) => {
    const routeHandler: SingleCrudHandler = smartRouteHandler(
      accessTypes,
      (accessType) => {
        const frw = routeHandlerTypeHelper({
          request: yup.object({
            auth: yup.object({
              type: yup.string().oneOf([accessType]).required(),
            }).required(),
            url: yup.string().required(),
            method: yup.string().oneOf([httpMethod]).required(),
            body: typedIncludes(["Create", "Update", "Delete"] as const, crudOperation)
              ? crud[accessType][`${typedToLowercase(crudOperation)}Schema`] ?? throwErr(`No schema for ${crudOperation}; this should never happen`)
              : yup.mixed().oneOf([undefined]),
            params: crudOperation === "List" ? paramsSchema.partial() : paramsSchema,
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
            const adminInputSchema = typedIncludes(["Read", "List"] as const, crudOperation) ? undefined : crud.admin[`${typedToLowercase(crudOperation)}Schema`];
            const adminReadSchema = crud.admin.readSchema;
            const accessReadSchema = crud[accessType].readSchema;
            const adminResultSchema = crudOperation === "List" ? yup.array(adminReadSchema) : adminReadSchema;
            const accessResultSchema = crudOperation === "List" ? yup.array(accessReadSchema) : accessReadSchema;
            if (!adminInputSchema || !adminResultSchema || !accessResultSchema) {
              throw new StackAssertionError(`Schema not available for ${crudOperation}; this should never happen`);
            }

            const handlersUnfiltered = options as Partial<CrudRouteHandlersUnfiltered<CrudTypeOf<S>, any>>;
            const data = req.body;
            const adminData = adminInputSchema ? await validate(data, adminInputSchema, true) : undefined;
            const result = await handlersUnfiltered[`on${crudOperation}`]?.(req.params, adminData);
            const resultAdminValidated = crudOperation === "Delete" ? undefined : await validate(result, adminResultSchema, false);
            const resultAccessValidated = crudOperation === "Delete" ? undefined : await validate(resultAdminValidated, accessResultSchema, false);

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
    return [`${typedToLowercase(crudOperation)}Handler`, routeHandler];
  })) as any;
}

async function validate<T>(obj: unknown, schema: yup.ISchema<T>, cast: boolean): Promise<T> {
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
