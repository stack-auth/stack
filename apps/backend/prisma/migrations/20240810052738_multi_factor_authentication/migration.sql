/*
  Warnings:

  - You are about to drop the column `email` on the `VerificationCode` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "VerificationCodeType" ADD VALUE 'MFA_ATTEMPT';

-- AlterTable
ALTER TABLE "ProjectUser" ADD COLUMN     "requiresTotpMfa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" BYTEA;

-- AlterTable
ALTER TABLE "VerificationCode" DROP COLUMN "email",
ADD COLUMN     "method" JSONB NOT NULL DEFAULT 'null';
