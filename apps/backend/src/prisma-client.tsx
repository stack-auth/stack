import { PrismaClient } from "@prisma/client";
import { getNodeEnvironment } from "@stackframe/stack-shared/dist/utils/env";

// In dev mode, fast refresh causes us to recreate many Prisma clients, eventually overloading the database.
// Therefore, only create one Prisma client in dev mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const prismaClient = globalForPrisma.prisma || new PrismaClient();

if (getNodeEnvironment() !== "production") {
  globalForPrisma.prisma = prismaClient;
}
