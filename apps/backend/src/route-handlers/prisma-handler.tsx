import { CrudSchema, CrudTypeOf } from "@stackframe/stack-shared/dist/crud";
import { CrudHandlers, ParamsSchema, QuerySchema, createCrudHandlers } from "./crud-handler";
import { SmartRequestAuth } from "./smart-request";
import { Prisma } from "@prisma/client";
import { GetResult } from "@prisma/client/runtime/library";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { prismaClient } from "@/prisma-client";
import * as yup from "yup";
import { typedAssign } from "@stackframe/stack-shared/dist/utils/objects";

type AllPrismaModelNames = Prisma.TypeMap["meta"]["modelProps"];
type WhereUnique<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["findUniqueOrThrow"]["args"]["where"];
type WhereMany<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["findMany"]["args"]["where"];
type Where<T extends AllPrismaModelNames> = { [K in keyof WhereMany<T> as (K extends keyof WhereUnique<T> ? K : never)]: WhereMany<T>[K] };
type Include<T extends AllPrismaModelNames> = (Prisma.TypeMap["model"][Capitalize<T>]["operations"]["findMany"]["args"] & { include?: unknown })["include"];
type BaseFields<T extends AllPrismaModelNames> = Where<T> & Partial<PCreate<T>>;
type PRead<T extends AllPrismaModelNames, W extends Where<T>, I extends Include<T>> = GetResult<Prisma.TypeMap["model"][Capitalize<T>]["payload"], { where: W, include: I }, "findUniqueOrThrow">;
type PUpdate<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["update"]["args"]["data"];
type PCreate<T extends AllPrismaModelNames> = Prisma.TypeMap["model"][Capitalize<T>]["operations"]["create"]["args"]["data"];
type PEitherWrite<T extends AllPrismaModelNames> = (PCreate<T> | PUpdate<T>) & Partial<(PCreate<T> | {}) & (PUpdate<T> | {})>;

type Context<AllParams extends boolean, PS extends ParamsSchema> = {
  params: [AllParams] extends [true] ? yup.InferType<PS> : Partial<yup.InferType<PS>>,
  auth: SmartRequestAuth,
};

type CrudToPrismaContext<AllParams extends boolean, PS extends ParamsSchema> = Context<AllParams, PS> & { type: 'update' | 'create' };

type CRead<T extends CrudTypeOf<any>> = T extends { Admin: { Read: infer R } } ? R : never;
type CCreate<T extends CrudTypeOf<any>> = T extends { Admin: { Create: infer R } } ? R : never;
type CUpdate<T extends CrudTypeOf<any>> = T extends { Admin: { Update: infer R } } ? R : never;
type CEitherWrite<T extends CrudTypeOf<any>> = (CCreate<T> | CUpdate<T>) & Partial<CCreate<T> & CUpdate<T>>;

type CrudHandlersFromCrudType<T extends CrudTypeOf<CrudSchema>, PS extends ParamsSchema, QS extends QuerySchema> = CrudHandlers<
  T,
  PS,
  QS,
  | ("Create" extends keyof T["Admin"] ? "Create" : never)
  | ("Read" extends keyof T["Admin"] ? "Read" : never)
  | ("Read" extends keyof T["Admin"] ? "List" : never)
  | ("Update" extends keyof T["Admin"] ? "Update" : never)
  | ("Delete" extends keyof T["Admin"] ? "Delete" : never)
>;

type ExtraDataFromCrudType<
  S extends CrudSchema,
  PrismaModelName extends AllPrismaModelNames,
  PS extends ParamsSchema,
  W extends Where<PrismaModelName>,
  I extends Include<PrismaModelName>,
  B extends BaseFields<PrismaModelName>,
> = {
  getInclude(params: yup.InferType<PS>, context: Pick<Context<false, PS>, "auth">): Promise<I>,
  transformPrismaToCrudObject(prismaOrNull: PRead<PrismaModelName, W & B, I> | null, params: yup.InferType<PS>, context: Pick<Context<false, PS>, "auth">): Promise<CRead<CrudTypeOf<S>>>,
};

export function createPrismaCrudHandlers<
  S extends CrudSchema,
  PrismaModelName extends AllPrismaModelNames,
  PS extends ParamsSchema,
  QS extends QuerySchema,
  W extends Where<PrismaModelName>,
  I extends Include<PrismaModelName>,
  B extends BaseFields<PrismaModelName>,
>(
  crudSchema: S,
  prismaModelName: PrismaModelName,
  options: & {
      paramsSchema: PS,
      querySchema?: QS,
      onPrepare?: (context: Context<false, PS>) => Promise<void>,
      baseFields: (context: Context<false, PS>) => Promise<B>,
      where?: (context: Context<false, PS>) => Promise<W>,
      whereUnique?: (context: Context<true, PS>) => Promise<WhereUnique<PrismaModelName>>,
      include: (context: Context<false, PS>) => Promise<I>,
      crudToPrisma: (crud: CEitherWrite<CrudTypeOf<S>>, context: CrudToPrismaContext<false, PS>) => Promise<PEitherWrite<PrismaModelName>>,
      prismaToCrud: (prisma: PRead<PrismaModelName, W & B, I>, context: Context<false, PS>) => Promise<CRead<CrudTypeOf<S>>>,
      notFoundToCrud: (context: Context<false, PS>) => Promise<CRead<CrudTypeOf<S>> | never>,
      onCreate?: (prisma: PRead<PrismaModelName, W & B, I>, context: Context<false, PS>) => Promise<void>,
    },
): CrudHandlersFromCrudType<CrudTypeOf<S>, PS, QS> & ExtraDataFromCrudType<S, PrismaModelName, PS, W, I, B> {
  const wrapper = <AllParams extends boolean, T>(allParams: AllParams, func: (data: any, context: Context<AllParams, PS>) => Promise<T>): (opts: Context<AllParams, PS> & { data?: unknown }) => Promise<T> => {
    return async (req) => {
      const context: Context<AllParams, PS> = {
        params: req.params,
        auth: req.auth,
      };
      return await func(req.data, context);
    };
  };

  const prismaOrNullToCrud = (prismaOrNull: PRead<PrismaModelName, W & B, I> | null, context: Context<false, PS>) => {
    if (prismaOrNull === null) {
      return options.notFoundToCrud(context);
    } else {
      return options.prismaToCrud(prismaOrNull, context);
    }
  };
  const crudToPrisma = options.crudToPrisma;
  
  return typedAssign(createCrudHandlers<any, PS, QS, any>(crudSchema, {
    paramsSchema: options.paramsSchema,
    querySchema: options.querySchema,
    onPrepare: options.onPrepare,
    onRead: wrapper(true, async (data, context) => {
      const prisma = await (prismaClient[prismaModelName].findUnique as any)({
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
          ...await options.whereUnique?.(context),
        },
      });
      return await prismaOrNullToCrud(prisma, context);
    }),
    onList: wrapper(false, async (data, context) => {
      const prisma: any[] = await (prismaClient[prismaModelName].findMany as any)({
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
        },
      });
      const items = await Promise.all(prisma.map((p) => prismaOrNullToCrud(p, context)));
      return {
        items,
        is_paginated: false,
      };
    }),
    onCreate: wrapper(false, async (data, context) => {
      const prisma = await (prismaClient[prismaModelName].create as any)({
        include: await options.include(context),
        data: {
          ...await options.baseFields(context),
          ...await crudToPrisma(data, { ...context, type: 'create' }),
        },
      });
      // TODO pass the same transaction to onCreate as the one that creates the user row
      // we should probably do this with all functions and pass a transaction around in the context
      await options.onCreate?.(prisma, context);
      return await prismaOrNullToCrud(prisma, context);
    }),
    onUpdate: wrapper(true, async (data, context) => {
      const baseQuery: any = {
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
          ...await options.whereUnique?.(context),
        },
      };
      // TODO transaction here for the read and write
      const prismaRead = await (prismaClient[prismaModelName].findUnique as any)({
        ...baseQuery,
      });
      if (prismaRead === null) {
        return await prismaOrNullToCrud(null, context);
      } else {
        const prisma = await (prismaClient[prismaModelName].update as any)({
          ...baseQuery,
          data: await crudToPrisma(data, { ...context, type: 'update' }),
        });
        return await prismaOrNullToCrud(prisma, context);
      }
    }),
    onDelete: wrapper(true, async (data, context) => {
      const baseQuery: any = {
        include: await options.include(context),
        where: {
          ...await options.baseFields(context),
          ...await options.where?.(context),
          ...await options.whereUnique?.(context),
        },
      };
      // TODO transaction here for the read and write
      const prismaRead = await (prismaClient[prismaModelName].findUnique as any)({
        ...baseQuery,
      });
      if (prismaRead !== null) {
        await (prismaClient[prismaModelName].delete as any)({
          ...baseQuery
        });
      }
    }),
  }), {
    getInclude(params, context) {
      return options.include({
        ...context,
        params,
      });
    },
    transformPrismaToCrudObject(prismaOrNull, params, context) {
      return prismaOrNullToCrud(prismaOrNull, {
        ...context,
        params,
      });
    },
  } satisfies ExtraDataFromCrudType<S, PrismaModelName, PS, W, I, B>);
}
