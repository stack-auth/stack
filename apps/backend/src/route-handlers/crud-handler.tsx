import "../polyfills";

import * as yup from "yup";
import { SmartRouteHandler, SmartRouteHandlerOverloadMetadata, routeHandlerTypeHelper, createSmartRouteHandler } from "./smart-route-handler";
import { CrudOperation, CrudSchema, CrudTypeOf } from "@stackframe/stack-shared/dist/crud";
import { FilterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { deindent, typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { SmartRequestAuth } from "./smart-request";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";

type GetAdminKey<T extends CrudTypeOf<any>, K extends Capitalize<CrudOperation>> = K extends keyof T["Admin"] ? T["Admin"][K] : void;

type CrudSingleRouteHandler<T extends CrudTypeOf<any>, K extends Capitalize<CrudOperation>, Params extends {}, Multi extends boolean = false> =
  K extends keyof T["Admin"]
    ? (options: {
      params: Params,
      data: (K extends "Read" ? void : GetAdminKey<T, K>),
      auth: SmartRequestAuth,
    }) => Promise<
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

export type RouteHandlerMetadataMap = {
  create?: SmartRouteHandlerOverloadMetadata,
  read?: SmartRouteHandlerOverloadMetadata,
  list?: SmartRouteHandlerOverloadMetadata,
  update?: SmartRouteHandlerOverloadMetadata,
  delete?: SmartRouteHandlerOverloadMetadata,
};

type CrudHandlerOptions<T extends CrudTypeOf<any>, ParamNames extends string> =
  & FilterUndefined<CrudRouteHandlersUnfiltered<T, Record<ParamNames, string>>>
  & {
    paramNames: ParamNames[],
    metadataMap?: RouteHandlerMetadataMap,
  };

type CrudHandlersFromOptions<O extends CrudHandlerOptions<CrudTypeOf<any>, any>> = CrudHandlers<
  | ("onCreate" extends keyof O ? "Create" : never)
  | ("onRead" extends keyof O ? "Read" : never)
  | ("onList" extends keyof O ? "List" : never)
  | ("onUpdate" extends keyof O ? "Update" : never)
  | ("onDelete" extends keyof O ? "Delete" : never)
>

export type CrudHandlers<
  T extends "Create" | "Read" | "List" | "Update" | "Delete",
> = {
  [K in `${Lowercase<T>}Handler`]: SmartRouteHandler
};

export function createCrudHandlers<S extends CrudSchema, O extends CrudHandlerOptions<CrudTypeOf<S>, any>>(
  crud: S, 
  options: O,
): CrudHandlersFromOptions<O> {
  const optionsAsPartial = options as Partial<CrudRouteHandlersUnfiltered<CrudTypeOf<S>, any>>;

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

  return Object.fromEntries(
    operations.filter(([_, crudOperation]) => optionsAsPartial[`on${crudOperation}`] !== undefined)
      .map(([httpMethod, crudOperation]) => {
        const getSchemas = (accessType: "admin" | "server" | "client") => {
          const input =
            typedIncludes(["Read", "List"] as const, crudOperation)
              ? yup.mixed().oneOf([undefined])
              : crud[accessType][`${typedToLowercase(crudOperation)}Schema`] ?? throwErr(`No input schema for ${crudOperation} with access type ${accessType}; this should never happen`);
          const read = crud[accessType].readSchema ?? yup.mixed().oneOf([undefined]);
          const output =
            crudOperation === "List"
              ? yup.object({
                items: yup.array(read).required(),
              }).required()
              : crudOperation === "Delete"
                ? yup.mixed().oneOf([undefined])
                : read;
          return { input, output };
        };

        const availableAccessTypes = accessTypes.filter((accessType) => {
          const crudOperationWithoutList = crudOperation === "List" ? "Read" : crudOperation;
          return crud[accessType][`${typedToLowercase(crudOperationWithoutList)}Schema`] !== undefined;
        });

        const routeHandler = createSmartRouteHandler(
          availableAccessTypes,
          (accessType) => {
            const adminSchemas = getSchemas("admin");
            const accessSchemas = getSchemas(accessType);

            const frw = routeHandlerTypeHelper({
              request: yup.object({
                auth: yup.object({
                  type: yup.string().oneOf(["server", accessType]).required(),
                }).required(),
                url: yup.string().required(),
                method: yup.string().oneOf([httpMethod]).required(),
                body: accessSchemas.input,
                params: crudOperation === "List" ? paramsSchema.partial() : paramsSchema,
              }),
              response: yup.object({
                statusCode: yup.number().oneOf([200, 201]).required(),
                headers: yup.object().shape({
                  location: yup.array(yup.string().required()).optional(),
                }),
                bodyType: yup.string().oneOf(["json"]).required(),
                body: accessSchemas.output,
              }),
              handler: async (req, fullReq) => {
                const data = req.body;
                const adminData = await validate(data, adminSchemas.input, "Input validation");

                const result = await optionsAsPartial[`on${crudOperation}`]?.({
                  params: req.params,
                  data: adminData,
                  auth: fullReq.auth ?? throwErr("Auth not found in CRUD handler; this should never happen! (all clients are at least client to access CRUD handler)"),
                });

                const resultAdminValidated = await validate(result, adminSchemas.output, "Result admin validation");
                const resultAccessValidated = await validate(resultAdminValidated, accessSchemas.output, `Result ${accessType} validation`);

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
            return {
              ...frw,
              metadata: options.metadataMap?.[typedToLowercase(crudOperation)],
            };
          }
        );
        return [`${typedToLowercase(crudOperation)}Handler`, routeHandler];
      })
  ) as any;
}

async function validate<T>(obj: unknown, schema: yup.ISchema<T>, name: string): Promise<T> {
  try {
    return await schema.validate(obj, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new StackAssertionError(
        deindent`
          ${name} failed in CRUD handler.
          
          Errors:
            ${error.errors.join("\n")}
        `,
        { obj: JSON.stringify(obj), schema },
        { cause: error }
      );
    }
    throw error;
  }
}
