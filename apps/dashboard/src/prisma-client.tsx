
import { PrismaClient } from '@prisma/client';

// In dev mode, fast refresh causes us to recreate many Prisma clients, eventually overloading the database.
// Therefore, only create one Prisma client in dev mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const prismaClient = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

