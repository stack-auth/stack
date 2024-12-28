import { Prisma, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { getEnvVariable, getNodeEnvironment } from '@stackframe/stack-shared/dist/utils/env';
import { filterUndefined, typedFromEntries, typedKeys } from "@stackframe/stack-shared/dist/utils/objects";
import { Result } from "@stackframe/stack-shared/dist/utils/results";
import { traceSpan } from "./utils/telemetry";

// In dev mode, fast refresh causes us to recreate many Prisma clients, eventually overloading the database.
// Therefore, only create one Prisma client in dev mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const useAccelerate = getEnvVariable('STACK_ACCELERATE_ENABLED', 'false') === 'true';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const prismaClient = globalForPrisma.prisma || (useAccelerate ? new PrismaClient().$extends(withAccelerate()) : new PrismaClient());

if (getNodeEnvironment() !== 'production') {
  globalForPrisma.prisma = prismaClient;
}


export async function retryTransaction<T>(fn: (...args: Parameters<Parameters<typeof prismaClient.$transaction>[0]>) => Promise<T>): Promise<T> {
  const isDev = getNodeEnvironment() === 'development';

  return await traceSpan('Prisma transaction', async () => {
    const res = await Result.retry(async (attempt) => {
      return await traceSpan(`transaction attempt #${attempt}`, async () => {
        try {
          return Result.ok(await prismaClient.$transaction(fn));
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError) {
            // retry
            return Result.error(e);
          }
          throw e;
        }
      });
    }, isDev ? 1 : 3);

    return Result.orThrow(res);
  });
}

export type RawQuery<T> = {
  sql: Prisma.Sql,
  postProcess: (rows: any[]) => T,  // Tip: If your postProcess is async, just set T = Promise<any> (compared to doing Promise.all in rawQuery, this ensures that there are no accidental timing attacks)
};

export async function rawQuery<Q extends RawQuery<any>>(query: Q): Promise<Awaited<ReturnType<Q["postProcess"]>>> {
  const result = await rawQueryArray([query]);
  return result[0];
}

export async function rawQueryAll<Q extends Record<string, undefined | RawQuery<any>>>(queries: Q): Promise<{ [K in keyof Q]: Awaited<ReturnType<NonNullable<Q[K]>["postProcess"]>> }> {
  const keys = typedKeys(filterUndefined(queries));
  const result = await rawQueryArray(keys.map(key => queries[key as any] as any));
  return typedFromEntries(keys.map((key, index) => [key, result[index]])) as any;
}

async function rawQueryArray<Q extends RawQuery<any>[]>(queries: Q): Promise<[] & { [K in keyof Q]: Awaited<ReturnType<Q[K]["postProcess"]>> }> {
  return await traceSpan({
    description: `raw SQL quer${queries.length === 1 ? "y" : `ies (${queries.length} total)`}`,
    attributes: {
      "stack.raw-queries.length": queries.length,
      ...Object.fromEntries(queries.map((q, index) => [`stack.raw-queries.${index}`, q.sql.text])),
    },
  }, async () => {
    if (queries.length === 0) return [] as any;

    const query = Prisma.sql`
      WITH ${Prisma.join(queries.map((q, index) => {
        return Prisma.sql`${Prisma.raw("q" + index)} AS (
          ${q.sql}
        )`;
      }), ",\n")}

      ${Prisma.join(queries.map((q, index) => {
        return Prisma.sql`
          SELECT
            ${"q" + index} AS type,
            row_to_json(c) AS json
          FROM (SELECT * FROM ${Prisma.raw("q" + index)}) c
        `;
      }), "\nUNION ALL\n")}
    `;
    const rawResult = await prismaClient.$queryRaw(query) as { type: string, json: any }[];
    const unprocessed = new Array(queries.length).fill(null).map(() => [] as any[]);
    for (const row of rawResult) {
      const type = row.type;
      const index = +type.slice(1);
      unprocessed[index].push(row.json);
    }
    const postProcessed = queries.map((q, index) => q.postProcess(unprocessed[index]));
    return postProcessed as any;
  });
}

