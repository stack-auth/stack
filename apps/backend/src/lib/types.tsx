import { PrismaClient } from "@prisma/client";

export type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
