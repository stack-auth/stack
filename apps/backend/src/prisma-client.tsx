import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { getEnvVariable, getNodeEnvironment } from '@stackframe/stack-shared/dist/utils/env';

// In dev mode, fast refresh causes us to recreate many Prisma clients, eventually overloading the database.
// Therefore, only create one Prisma client in dev mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const useAccelerate = getEnvVariable('STACK_ACCELERATE_ENABLED', 'false') === 'true';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const prismaClient = globalForPrisma.prisma || (useAccelerate ? new PrismaClient().$extends(withAccelerate()) : new PrismaClient());

if (getNodeEnvironment() !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

