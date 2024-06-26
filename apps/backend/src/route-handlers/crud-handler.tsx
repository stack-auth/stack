import "../polyfills";

import * as yup from "yup";
import { SmartRouteHandler, SmartRouteHandlerOverloadMetadata, routeHandlerTypeHelper, createSmartRouteHandler } from "./smart-route-handler";
import { CrudOperation, CrudSchema, CrudTypeOf } from "@stackframe/stack-shared/dist/crud";
import { FilterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { deindent, typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { SmartRequestAuth } from "./smart-request";
import { ProjectJson } from "@stackframe/stack-shared";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";

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
  onCreate?: CrudSingleRouteHandler<T, "Create", Params>,
  onRead?: CrudSingleRouteHandler<T, "Read", Params>,
  onList?: keyof Params extends never ? void : CrudSingleRouteHandler<T, "Read", Partial<Params>, true>,
  onUpdate?: CrudSingleRouteHandler<T, "Update", Params>,
  onDelete?: CrudSingleRouteHandler<T, "Delete", Params>,
};

export type RouteHandlerMetadataMap = {
  create?: SmartRouteHandlerOverloadMetadata,
  read?: SmartRouteHandlerOverloadMetadata,
  list?: SmartRouteHandlerOverloadMetadata,
  update?: SmartRouteHandlerOverloadMetadata,
  delete?: SmartRouteHandlerOverloadMetadata,
};

export type ParamsSchema = yup.ObjectSchema<{}>;

type CrudHandlerOptions<T extends CrudTypeOf<any>, PS extends ParamsSchema> =
  & FilterUndefined<CrudRouteHandlersUnfiltered<T, yup.InferType<PS>>>
  & {
    paramsSchema: PS,
    metadataMap?: RouteHandlerMetadataMap,
  };

type CrudHandlersFromOptions<T extends CrudTypeOf<any>, PS extends ParamsSchema, O extends CrudHandlerOptions<CrudTypeOf<any>, ParamsSchema>> = CrudHandlers<
  T,
  PS,
  ("onCreate" extends keyof O ? "Create" : never)
  | ("onRead" extends keyof O ? "Read" : never)
  | ("onList" extends keyof O ? "List" : never)
  | ("onUpdate" extends keyof O ? "Update" : never)
  | ("onDelete" extends keyof O ? "Delete" : never)
>

type CrudHandlerDirectByAccess<
  A extends "Client" | "Server" | "Admin",
  T extends CrudTypeOf<any>,
  PS extends ParamsSchema,
  L extends "Create" | "Read" | "List" | "Update" | "Delete"
> = {
  [K in (keyof T[A]) & L as `${Uncapitalize<A>}${K}`]: (options:
    & {
      project: ProjectJson,
      user?: UsersCrud["Admin"]["Read"],
    }
    & yup.InferType<PS>
    & (K extends "Read" ? {} : {
      data: K extends "Read" ? void : T[A][K],
    })
  ) => Promise<"Read" extends keyof T[A] ? (K extends "Delete" ? void : T[A]["Read"]) : void>
};

export type CrudHandlers<
  T extends CrudTypeOf<any>,
  PS extends ParamsSchema,
  L extends "Create" | "Read" | "List" | "Update" | "Delete",
> =
& {
  [K in `${Uncapitalize<L>}Handler`]: SmartRouteHandler
}
& CrudHandlerDirectByAccess<"Client", T, PS, L>
& CrudHandlerDirectByAccess<"Server", T, PS, L>
& CrudHandlerDirectByAccess<"Admin", T, PS, L>;

export function createCrudHandlers<S extends CrudSchema, PS extends ParamsSchema, O extends CrudHandlerOptions<CrudTypeOf<S>, PS>>(
  crud: S, 
  options: O,
): CrudHandlersFromOptions<CrudTypeOf<S>, PS, O> {
  const optionsAsPartial = options as Partial<CrudRouteHandlersUnfiltered<CrudTypeOf<S>, any>>;

  const operations = [
    ["GET", "Read"],
    ["GET", "List"],
    ["POST", "Create"],
    ["PUT", "Update"],
    ["DELETE", "Delete"],
  ] as const;
  const accessTypes = ["client", "server", "admin"] as const;

  const paramsSchema = options.paramsSchema;

  return Object.fromEntries(
    operations.filter(([_, crudOperation]) => optionsAsPartial[`on${crudOperation}`] !== undefined)
      .flatMap(([httpMethod, crudOperation]) => {
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

        const aat = new Map(availableAccessTypes.map((accessType) => {
          const adminSchemas = getSchemas("admin");
          const accessSchemas = getSchemas(accessType);
          return [
            accessType,
            {
              accessSchemas,
              adminSchemas,
              invoke: async (options: { params: yup.InferType<PS> | Partial<yup.InferType<PS>>, data: any, auth: SmartRequestAuth }) => {
                const actualParamsSchema = crudOperation === "List" ? paramsSchema.partial() : paramsSchema;
                const paramsValidated = await validate(options.params, actualParamsSchema, "Params validation");

                const adminData = await validate(options.data, adminSchemas.input, "Input validation");

                const result = await optionsAsPartial[`on${crudOperation}`]?.({
                  params: paramsValidated,
                  data: adminData,
                  auth: options.auth,
                });

                const resultAdminValidated = await validate(result, adminSchemas.output, "Result admin validation");
                const resultAccessValidated = await validate(resultAdminValidated, accessSchemas.output, `Result ${accessType} validation`);

                return resultAccessValidated;
              },
            },
          ];
        }));

        const routeHandler = createSmartRouteHandler(
          [...aat],
          ([accessType, { invoke, accessSchemas, adminSchemas }]) => {
            const frw = routeHandlerTypeHelper({
              request: yup.object({
                auth: yup.object({
                  type: yup.string().oneOf([accessType]).required(),
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
                
                const result = await invoke({
                  params: req.params as any,
                  data,
                  auth: fullReq.auth ?? throwErr("Auth not found in CRUD handler; this should never happen! (all clients are at least client to access CRUD handler)"),
                });

                return {
                  statusCode: crudOperation === "Create" ? 201 : 200,
                  headers: {
                    location: crudOperation === "Create" ? [req.url] : undefined,
                  },
                  bodyType: "json",
                  body: result,
                };
              },
            });
            return {
              ...frw,
              metadata: options.metadataMap?.[typedToLowercase(crudOperation)],
            };
          }
        );
        return [
          [`${typedToLowercase(crudOperation)}Handler`, routeHandler],
          ...[...aat].map(([accessType, { invoke }]) => (
            [
              `${accessType}${crudOperation}`,
              async ({ user, project, data, ...params }: {
                params: yup.InferType<PS>,
                project: ProjectJson,
                user?: UsersCrud["Admin"]["Read"],
                data: any,
              }) => await invoke({
                params,
                data,
                auth: {
                  user,
                  project,
                  type: accessType,
                },
              
              }),
            ]
          )),
        ];
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
