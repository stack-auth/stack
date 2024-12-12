import { Prisma, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { getEnvVariable, getNodeEnvironment } from '@stackframe/stack-shared/dist/utils/env';
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { Result } from "@stackframe/stack-shared/dist/utils/results";

// In dev mode, fast refresh causes us to recreate many Prisma clients, eventually overloading the database.
// Therefore, only create one Prisma client in dev mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const useAccelerate = getEnvVariable('STACK_ACCELERATE_ENABLED', 'false') === 'true';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const prismaClient = globalForPrisma.prisma || (useAccelerate ? new PrismaClient().$extends(withAccelerate()) : new PrismaClient());

if (getNodeEnvironment() !== 'production') {
  globalForPrisma.prisma = prismaClient;
}


export async function maybeTransactionWithRetry<T>(fn: (...args: Parameters<Parameters<typeof prismaClient.$transaction>[0]>) => Promise<T>): Promise<T> {
  const isDev = getNodeEnvironment() === 'development';

  const res = await Result.retry(async () => {
    try {
      return Result.ok(await prismaClient.$transaction(fn));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // retry
        return Result.error(e);
      }
      throw e;
    }
  }, isDev ? 1 : 3);

  if (res.status === 'ok') {
    return res.data;
  }

  const retriesFailedWarning = new StackAssertionError("Failed to execute transaction despite retries! Falling back to non-transactional execution, which may cause data inconsistency.", { cause: res.error });
  if (isDev) {
    throw retriesFailedWarning;
  } else {
    captureError('maybeTransactionWithRetry', retriesFailedWarning);
    return await fn(prismaClient);
  }
}
