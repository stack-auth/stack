/*
  Warnings:

  - A unique constraint covering the columns `[innerState]` on the table `OAuthOuterInfo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `innerState` to the `OAuthOuterInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "VerificationCodeType" ADD VALUE 'CONTACT_CHANNEL_VERIFICATION';

-- DropForeignKey
ALTER TABLE "EmailServiceConfig" DROP CONSTRAINT "EmailServiceConfig_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "EmailTemplate" DROP CONSTRAINT "EmailTemplate_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDomain" DROP CONSTRAINT "ProjectDomain_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "ProxiedEmailServiceConfig" DROP CONSTRAINT "ProxiedEmailServiceConfig_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "StandardEmailServiceConfig" DROP CONSTRAINT "StandardEmailServiceConfig_projectConfigId_fkey";

-- AlterTable
ALTER TABLE "OAuthOuterInfo" ADD COLUMN     "innerState" TEXT;

-- BEGIN MANUALLY MODIFIED: Fill in the innerState column with the innerState value from the info json
UPDATE "OAuthOuterInfo" SET "innerState" = "info"->>'innerState';
ALTER TABLE "OAuthOuterInfo" ALTER COLUMN "innerState" SET NOT NULL;
-- END MANUALLY MODIFIED

-- CreateIndex
CREATE UNIQUE INDEX "OAuthOuterInfo_innerState_key" ON "OAuthOuterInfo"("innerState");

-- AddForeignKey
ALTER TABLE "ProjectDomain" ADD CONSTRAINT "ProjectDomain_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfig" ADD CONSTRAINT "EmailServiceConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "EmailServiceConfig"("projectConfigId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxiedEmailServiceConfig" ADD CONSTRAINT "ProxiedEmailServiceConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "EmailServiceConfig"("projectConfigId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardEmailServiceConfig" ADD CONSTRAINT "StandardEmailServiceConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "EmailServiceConfig"("projectConfigId") ON DELETE CASCADE ON UPDATE CASCADE;
