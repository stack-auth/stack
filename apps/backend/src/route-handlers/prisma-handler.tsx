import { CrudSchema, CrudTypeOf } from "@stackframe/stack-shared/dist/crud";
import { CrudHandlers, RouteHandlerMetadataMap, createCrudHandlers } from "./crud-handler";
import { SmartRequestAuth } from "./smart-request";
import { Prisma } from "@prisma/client";
import { GetResult } from "@prisma/client/runtime/library";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { prismaClient } from "@/prisma-client";

type AllPrismaModelNames = Prisma.TypeMap["meta"]["modelProps"];
type WhereUnique<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["findUniqueOrThrow"]["args"]["where"];
type WhereMany<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["findMany"]["args"]["where"];
type Where<T extends AllPrismaModelNames> = { [K in keyof WhereMany<T> as (K extends keyof WhereUnique<T> ? K : never)]: WhereMany<T>[K] };
type Include<T extends AllPrismaModelNames> = (Prisma.TypeMap["model"][Capitalize<T>]["operations"]["findMany"]["args"] & { include?: unknown })["include"];
type BaseFields<T extends AllPrismaModelNames> = Where<T> & Partial<PCreate<T>>;
type PRead<T extends AllPrismaModelNames, W extends Where<T>, I extends Include<T>> = GetResult<Prisma.TypeMap["model"][Capitalize<T>]["payload"], { where: W, include: I }, "findUniqueOrThrow">;
type PUpdate<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["update"]["args"]["data"];
type PCreate<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["create"]["args"]["data"];

type Context<ParamName extends string> = {
  params: Record<ParamName, string>,
  auth: SmartRequestAuth,
};

type CRead<T extends CrudTypeOf<any>> = T extends { Admin: { Read: infer R } } ? R : never;
type CCreate<T extends CrudTypeOf<any>> = T extends { Admin: { Create: infer R } } ? R : never;
type CUpdate<T extends CrudTypeOf<any>> = T extends { Admin: { Update: infer R } } ? R : never;
type CEitherWrite<T extends CrudTypeOf<any>> = CCreate<T> | CUpdate<T>;

export type CrudHandlersFromCrudType<T extends CrudTypeOf<CrudSchema>> = CrudHandlers<
  | ("Create" extends keyof T["Admin"] ? "Create" : never)
  | ("Read" extends keyof T["Admin"] ? "Read" : never)
  | ("Read" extends keyof T["Admin"] ? "List" : never)
  | ("Update" extends keyof T["Admin"] ? "Update" : never)
  | ("Delete" extends keyof T["Admin"] ? "Delete" : never)
>;

export function createPrismaCrudHandlers<
  S extends CrudSchema,
  PrismaModelName extends AllPrismaModelNames,
  ParamName extends string,
  W extends Where<PrismaModelName>,
  I extends Include<PrismaModelName>,
  B extends BaseFields<PrismaModelName>,
>(
  crudSchema: S,
  prismaModelName: PrismaModelName,
  options: & {
      paramNames: ParamName[],
      baseFields: (context: Context<ParamName>) => Promise<B>,
      where?: (context: Context<ParamName>) => Promise<W>,
      whereUnique?: (context: Context<ParamName>) => Promise<WhereUnique<PrismaModelName>>,
      include: (context: Context<ParamName>) => Promise<I>,
      crudToPrisma?: ((crud: CEitherWrite<CrudTypeOf<S>>, context: Context<ParamName>) => Promise<PUpdate<PrismaModelName> | Omit<PCreate<PrismaModelName>, keyof B>>),
      prismaToCrud?: (prisma: PRead<PrismaModelName, W & B, I>, context: Context<ParamName>) => Promise<CRead<CrudTypeOf<S>>>,
      fieldMapping?: any,
      createNotFoundError?: (context: Context<ParamName>) => Error,
      metadataMap?: RouteHandlerMetadataMap,
    }
    & (
      | {
        crudToPrisma: {},
        prismaToCrud: {},
        fieldMapping?: void,
      }
      | {
        crudToPrisma: void,
        prismaToCrud: void,
        fieldMapping: {},
      }
    ),
): CrudHandlersFromCrudType<CrudTypeOf<S>> {
  const wrapper = <T,>(func: (data: any, context: Context<ParamName>, queryBase: any) => Promise<T>): (opts: { params: Record<ParamName, string>, data?: unknown, auth: SmartRequestAuth }) => Promise<T> => {
    return async (req) => {
      const context: Context<ParamName> = {
        params: req.params,
        auth: req.auth,
      };
      const whereBase = await options.where?.(context);
      const includeBase = await options.include(context);
      try {
        return await func(req.data, context, { where: whereBase, include: includeBase });
      } catch (e) {
        if ((e as any)?.code === 'P2025') {
          throw (options.createNotFoundError ?? (() => new StatusError(StatusError.NotFound)))(context);
        }
        throw e;
      }
    };
  };

  const prismaToCrud = options.prismaToCrud ?? throwErr("missing prismaToCrud is not yet implemented");
  const crudToPrisma = options.crudToPrisma ?? throwErr("missing crudToPrisma is not yet implemented");

  return createCrudHandlers<any, any>(crudSchema, {
    paramNames: options.paramNames,
    onRead: wrapper(async (data, context) => {
      const prisma = await (prismaClient[prismaModelName].findUniqueOrThrow as any)({
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
          ...await options.whereUnique?.(context),
        },
      });
      return await prismaToCrud(prisma, context);
    }),
    onList: wrapper(async (data, context) => {
      const prisma: any[] = await (prismaClient[prismaModelName].findMany as any)({
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
        },
      });
      const items = await Promise.all(prisma.map((p) => prismaToCrud(p, context)));
      return {
        items,
      };
    }),
    onCreate: wrapper(async (data, context) => {
      const prisma = await (prismaClient[prismaModelName].create as any)({
        include: await options.include(context),
        data: {
          ...await options.baseFields(context),
          ...await crudToPrisma(data, context),
        },
      });
      return await prismaToCrud(prisma, context);
    }),
    onUpdate: wrapper(async (data, context) => {
      const prisma = await (prismaClient[prismaModelName].update as any)({
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
          ...await options.whereUnique?.(context),
        },
        data: await crudToPrisma(data, context),
      });
      return await prismaToCrud(prisma, context);
    }),
    onDelete: wrapper(async (data, context) => {
      await (prismaClient[prismaModelName].delete as any)({
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
          ...await options.whereUnique?.(context),
        },
      });
    }),
    metadataMap: options.metadataMap,
  });
}
