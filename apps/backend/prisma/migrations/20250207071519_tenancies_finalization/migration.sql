/*
  Warnings:

  x The primary key for the `VerificationCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  x A unique constraint covering the columns `[mirroredProjectId,mirroredBranchId,projectUserId]` on the table `ProjectUser` will be added. If there are existing duplicate values, this will fail.
  x A unique constraint covering the columns `[mirroredProjectId,mirroredBranchId,teamId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  x A unique constraint covering the columns `[projectId,branchId,code]` on the table `VerificationCode` will be added. If there are existing duplicate values, this will fail.
  x Made the column `tenancyId` on table `OAuthAccessToken` required. This step will fail if there are existing NULL values in that column.
  x Made the column `tenancyId` on table `OAuthToken` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `mirroredBranchId` to the `ProjectUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mirroredProjectId` to the `ProjectUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mirroredBranchId` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mirroredProjectId` to the `Team` table without a default value. This is not possible if the table is not empty.
  x Made the column `tenancyId` on table `TeamMemberDirectPermission` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `branchId` to the `VerificationCode` table without a default value. This is not possible if the table is not empty.
*/

-- DropIndex
DROP INDEX "VerificationCode_projectId_code_key";

-- AlterTable
ALTER TABLE "OAuthAccessToken" ALTER COLUMN "tenancyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "OAuthToken" ALTER COLUMN "tenancyId" SET NOT NULL;

-- AlterTable for ProjectUser: add columns without NOT NULL
ALTER TABLE "ProjectUser" 
  ADD COLUMN "mirroredBranchId" TEXT,
  ADD COLUMN "mirroredProjectId" TEXT;

-- Update ProjectUser: set new columns using values from associated Tenancy
UPDATE "ProjectUser"
SET "mirroredBranchId" = tenancy."branchId",
    "mirroredProjectId" = tenancy."projectId"
FROM "Tenancy" AS tenancy
WHERE "ProjectUser"."tenancyId" = tenancy."id";

-- Set NOT NULL constraints on ProjectUser new columns
ALTER TABLE "ProjectUser" 
  ALTER COLUMN "mirroredBranchId" SET NOT NULL,
  ALTER COLUMN "mirroredProjectId" SET NOT NULL;

-- AlterTable for Team: add columns without NOT NULL
ALTER TABLE "Team" 
  ADD COLUMN "mirroredBranchId" TEXT,
  ADD COLUMN "mirroredProjectId" TEXT;

-- Update Team: set new columns using values from associated Tenancy
UPDATE "Team"
SET "mirroredBranchId" = tenancy."branchId",
    "mirroredProjectId" = tenancy."projectId"
FROM "Tenancy" AS tenancy
WHERE "Team"."tenancyId" = tenancy."id";

-- Set NOT NULL constraints on Team new columns
ALTER TABLE "Team" 
  ALTER COLUMN "mirroredBranchId" SET NOT NULL,
  ALTER COLUMN "mirroredProjectId" SET NOT NULL;

-- Alter Table for TeamMemberDirectPermission
ALTER TABLE "TeamMemberDirectPermission" ALTER COLUMN "tenancyId" SET NOT NULL;

-- For VerificationCode: update branchId handling
ALTER TABLE "VerificationCode" DROP CONSTRAINT "VerificationCode_pkey";

-- Add the branchId column without NOT NULL
ALTER TABLE "VerificationCode" ADD COLUMN "branchId" TEXT;

-- Set branchId to 'main' for all existing rows
UPDATE "VerificationCode" SET "branchId" = 'main' WHERE "branchId" IS NULL;

-- Set NOT NULL constraint on branchId
ALTER TABLE "VerificationCode" ALTER COLUMN "branchId" SET NOT NULL;

-- Recreate primary key with new branchId
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("projectId", "branchId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUser_mirroredProjectId_mirroredBranchId_projectUserI_key" ON "ProjectUser"("mirroredProjectId", "mirroredBranchId", "projectUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_mirroredProjectId_mirroredBranchId_teamId_key" ON "Team"("mirroredProjectId", "mirroredBranchId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_projectId_branchId_code_key" ON "VerificationCode"("projectId", "branchId", "code");

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_mirroredProjectId_fkey" FOREIGN KEY ("mirroredProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Delete VerificationCodes with non-existing projectId
DELETE FROM "VerificationCode" WHERE "projectId" NOT IN (SELECT "id" FROM "Project");

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
