/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as yup from "yup";
import { CrudSchema, CrudTypeOf, CrudlOperation } from "@stackframe/stack-shared/dist/crud";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { yupArray, yupBoolean, yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { FilterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { deindent, typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import "../polyfills";
import { SmartRequestAuth } from "./smart-request";
import { SmartRouteHandler, createSmartRouteHandler, routeHandlerTypeHelper } from "./smart-route-handler";

type GetAdminKey<T extends CrudTypeOf<any>, K extends Capitalize<CrudlOperation>> = K extends keyof T["Admin"] ? T["Admin"][K] : void;

type CrudSingleRouteHandler<
  T extends CrudTypeOf<any>,
  K extends Capitalize<CrudlOperation>,
  Params extends {},
  Query extends {},
  Multi extends boolean = false,
> = K extends keyof T["Admin"]
  ? (options: {
      params: Params;
      data: K extends "Read" ? void : GetAdminKey<T, K>;
      auth: SmartRequestAuth;
      query: Query;
    }) => Promise<K extends "Delete" ? void : Multi extends true ? GetAdminKey<T, "List"> : GetAdminKey<T, "Read">>
  : void;

type CrudRouteHandlersUnfiltered<T extends CrudTypeOf<any>, Params extends {}, Query extends {}> = {
  onPrepare?: (options: {
    params: Params;
    auth: SmartRequestAuth;
    query: Query;
    type: "create" | "read" | "list" | "update" | "delete";
  }) => Promise<void>;
  onCreate?: CrudSingleRouteHandler<T, "Create", Params, Query>;
  onRead?: CrudSingleRouteHandler<T, "Read", Params, Query>;
  onList?: keyof Params extends never ? void : CrudSingleRouteHandler<T, "Read", Partial<Params>, Query, true>;
  onUpdate?: CrudSingleRouteHandler<T, "Update", Params, Query>;
  onDelete?: CrudSingleRouteHandler<T, "Delete", Params, Query>;
};

type CrudRouteHandlers<T extends CrudTypeOf<any>, Params extends {}, Query extends {}> = FilterUndefined<
  CrudRouteHandlersUnfiltered<T, Params, Query>
>;

export type ParamsSchema = yup.ObjectSchema<{}>;
export type QuerySchema = yup.ObjectSchema<{}>;

type CrudHandlersFromOptions<
  T extends CrudTypeOf<any>,
  PS extends ParamsSchema,
  QS extends QuerySchema,
  O extends CrudRouteHandlers<CrudTypeOf<any>, ParamsSchema, QuerySchema>,
> = CrudHandlers<
  T,
  PS,
  QS,
  | ("onCreate" extends keyof O ? "Create" : never)
  | ("onRead" extends keyof O ? "Read" : never)
  | ("onList" extends keyof O ? "List" : never)
  | ("onUpdate" extends keyof O ? "Update" : never)
  | ("onDelete" extends keyof O ? "Delete" : never)
>;

type CrudHandlerDirectByAccess<
  A extends "Client" | "Server" | "Admin",
  T extends CrudTypeOf<any>,
  PS extends ParamsSchema,
  QS extends QuerySchema,
  L extends "Create" | "Read" | "List" | "Update" | "Delete",
> = {
  [K in L as `${Uncapitalize<A>}${K}`]: (
    options: {
      project: ProjectsCrud["Admin"]["Read"];
      user?: UsersCrud["Admin"]["Read"];
      allowedErrorTypes?: (new (...args: any) => any)[];
    } & (({} extends yup.InferType<QS> ? {} : never) | { query: yup.InferType<QS> }) &
      (L extends "Create" | "List" ? Partial<yup.InferType<PS>> : yup.InferType<PS>) &
      (K extends "Read" | "List" | "Delete" ? {} : K extends keyof T[A] ? { data: T[A][K] } : "TYPE ERROR: something went wrong here"),
  ) => Promise<
    K extends "List"
      ? "List" extends keyof T[A]
        ? T[A]["List"]
        : void
      : K extends "Delete"
        ? void
        : "Read" extends keyof T[A]
          ? T[A]["Read"]
          : void
  >;
};

export type CrudHandlers<
  T extends CrudTypeOf<any>,
  PS extends ParamsSchema,
  QS extends QuerySchema,
  L extends "Create" | "Read" | "List" | "Update" | "Delete",
> = {
  [K in `${Uncapitalize<L>}Handler`]: SmartRouteHandler;
} & CrudHandlerDirectByAccess<"Client", T, PS, QS, L> &
  CrudHandlerDirectByAccess<"Server", T, PS, QS, L> &
  CrudHandlerDirectByAccess<"Admin", T, PS, QS, L>;

export function createCrudHandlers<
  S extends CrudSchema,
  PS extends ParamsSchema,
  QS extends QuerySchema,
  RH extends CrudRouteHandlers<CrudTypeOf<S>, yup.InferType<PS>, yup.InferType<QS>>,
>(
  crud: S,
  options: RH & {
    paramsSchema: PS;
    querySchema?: QS;
  },
): CrudHandlersFromOptions<CrudTypeOf<S>, PS, QS, RH> {
  const optionsAsPartial = options as Partial<CrudRouteHandlersUnfiltered<CrudTypeOf<S>, any, any>>;

  const operations = [
    ["GET", "Read"],
    ["GET", "List"],
    ["POST", "Create"],
    ["PATCH", "Update"],
    ["DELETE", "Delete"],
  ] as const;
  const accessTypes = ["client", "server", "admin"] as const;

  const paramsSchema = options.paramsSchema;

  return Object.fromEntries(
    operations
      .filter(([, crudOperation]) => optionsAsPartial[`on${crudOperation}`] !== undefined)
      .flatMap(([httpMethod, crudOperation]) => {
        const getSchemas = (accessType: "admin" | "server" | "client") => {
          const input = typedIncludes(["Read", "List"] as const, crudOperation)
            ? yupMixed<any>().oneOf([undefined])
            : (crud[accessType][`${typedToLowercase(crudOperation)}Schema`] ??
              throwErr(`No input schema for ${crudOperation} with access type ${accessType}; this should never happen`));
          const read = crud[accessType].readSchema ?? yupMixed<any>().oneOf([undefined]);
          const output =
            crudOperation === "List"
              ? yupObject({
                  items: yupArray(read).required(),
                  is_paginated: yupBoolean()
                    .oneOf([false])
                    .required()
                    .meta({ openapiField: { hidden: true } }),
                }).required()
              : crudOperation === "Delete"
                ? yupMixed<any>().oneOf([undefined])
                : read;
          return { input, output };
        };

        const availableAccessTypes = accessTypes.filter((accessType) => {
          const crudOperationWithoutList = crudOperation === "List" ? "Read" : crudOperation;
          return crud[accessType][`${typedToLowercase(crudOperationWithoutList)}Schema`] !== undefined;
        });

        const aat = new Map(
          availableAccessTypes.map((accessType) => {
            const adminSchemas = getSchemas("admin");
            const accessSchemas = getSchemas(accessType);
            return [
              accessType,
              {
                accessSchemas,
                adminSchemas,
                invoke: async (options: {
                  params: yup.InferType<PS> | Partial<yup.InferType<PS>>;
                  query: yup.InferType<QS>;
                  data: any;
                  auth: SmartRequestAuth;
                }) => {
                  const actualParamsSchema = typedIncludes(["List", "Create"], crudOperation) ? paramsSchema.partial() : paramsSchema;
                  const paramsValidated = await validate(options.params, actualParamsSchema, "Params validation");

                  const adminData = await validate(options.data, adminSchemas.input, "Input validation");

                  await optionsAsPartial.onPrepare?.({
                    params: paramsValidated,
                    auth: options.auth,
                    query: options.query,
                    type: typedToLowercase(crudOperation),
                  });
                  const result = await optionsAsPartial[`on${crudOperation}`]?.({
                    params: paramsValidated,
                    data: adminData,
                    auth: options.auth,
                    query: options.query,
                  });

                  const resultAdminValidated = await validate(result, adminSchemas.output, "Result admin validation");
                  const resultAccessValidated = await validate(
                    resultAdminValidated,
                    accessSchemas.output,
                    `Result ${accessType} validation`,
                  );

                  return resultAccessValidated;
                },
              },
            ];
          }),
        );

        const routeHandler = createSmartRouteHandler([...aat], ([accessType, { invoke, accessSchemas }]) => {
          const frw = routeHandlerTypeHelper({
            request: yupObject({
              auth: yupObject({
                type: yupString().oneOf([accessType]).required(),
              }).required(),
              url: yupString().required(),
              method: yupString().oneOf([httpMethod]).required(),
              body: accessSchemas.input,
              params: typedIncludes(["List", "Create"], crudOperation) ? paramsSchema.partial() : paramsSchema,
              query: (options.querySchema ?? yupObject({})) as QuerySchema,
            }),
            response: yupObject({
              statusCode: yupNumber()
                .oneOf([crudOperation === "Create" ? 201 : 200])
                .required(),
              headers: yupObject({}),
              bodyType: yupString()
                .oneOf([crudOperation === "Delete" ? "success" : "json"])
                .required(),
              body: accessSchemas.output,
            }),
            handler: async (req, fullReq) => {
              const data = req.body;

              const result = await invoke({
                params: req.params as any,
                query: req.query as any,
                data,
                auth:
                  fullReq.auth ??
                  throwErr(
                    "Auth not found in CRUD handler; this should never happen! (all clients are at least client to access CRUD handler)",
                  ),
              });

              return {
                statusCode: crudOperation === "Create" ? 201 : 200,
                headers: {},
                bodyType: crudOperation === "Delete" ? "success" : "json",
                body: result,
              };
            },
          });

          const metadata = crud[accessType][`${typedToLowercase(crudOperation)}Docs`];
          return {
            ...frw,
            metadata: metadata ? (metadata.hidden ? metadata : { ...metadata, crudOperation }) : undefined,
          };
        });
        return [
          [`${typedToLowercase(crudOperation)}Handler`, routeHandler],
          ...[...aat].map(([accessType, { invoke }]) => [
            `${accessType}${crudOperation}`,
            async ({
              user,
              project,
              data,
              query,
              allowedErrorTypes,
              ...params
            }: yup.InferType<PS> & {
              query?: yup.InferType<QS>;
              project: ProjectsCrud["Admin"]["Read"];
              user?: UsersCrud["Admin"]["Read"];
              data: any;
              allowedErrorTypes?: (new (...args: any) => any)[];
            }) => {
              try {
                return await invoke({
                  params,
                  query: query ?? ({} as any),
                  data,
                  auth: {
                    user,
                    project,
                    type: accessType,
                  },
                });
              } catch (error) {
                if (allowedErrorTypes?.some((a) => error instanceof a)) {
                  throw error;
                }
                throw new CrudHandlerInvocationError(error);
              }
            },
          ]),
        ];
      }),
  ) as any;
}

export class CrudHandlerInvocationError extends Error {
  constructor(public readonly cause: unknown) {
    super(
      "Error while invoking CRUD handler programmatically. This is a wrapper error to prevent caught errors (eg. StatusError) from being caught by outer catch blocks. Check the `cause` property.\n\nOriginal error: " +
        cause,
      { cause },
    );
  }
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
        { cause: error },
      );
    }
    throw error;
  }
}
