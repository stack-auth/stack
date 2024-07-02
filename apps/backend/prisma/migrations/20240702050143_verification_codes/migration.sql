-- CreateEnum
CREATE TYPE "VerificationCodeType" AS ENUM ('ONE_TIME_PASSWORD');

-- CreateTable
CREATE TABLE "VerificationCode" (
    "projectId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "VerificationCodeType" NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "redirectUrl" TEXT,
    "email" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("projectId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_projectId_code_key" ON "VerificationCode"("projectId", "code");
