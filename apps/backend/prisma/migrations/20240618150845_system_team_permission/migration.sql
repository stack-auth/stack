/*
  Warnings:

  - The primary key for the `TeamMemberDirectPermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[projectId,projectUserId,teamId,permissionDbId]` on the table `TeamMemberDirectPermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,projectUserId,teamId,systemPermission]` on the table `TeamMemberDirectPermission` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `TeamMemberDirectPermission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "TeamSystemPermission" AS ENUM ('UPDATE_TEAM', 'DELETE_TEAM', 'READ_MEMBERS', 'REMOVE_MEMBERS', 'INVITE_MEMBERS');

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "isDefaultTeamCreatorPermission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDefaultTeamMemberPermission" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PermissionEdge" ADD COLUMN     "parentTeamSystemPermission" "TeamSystemPermission",
ALTER COLUMN "parentPermissionDbId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN     "teamCreateDefaultSystemPermissions" "TeamSystemPermission"[],
ADD COLUMN     "teamMemberDefaultSystemPermissions" "TeamSystemPermission"[];


-- -- AlterTable
-- ALTER TABLE "TeamMemberDirectPermission" DROP CONSTRAINT "TeamMemberDirectPermission_pkey",
-- ADD COLUMN     "id" UUID NOT NULL,
-- ADD COLUMN     "systemPermission" "TeamSystemPermission",
-- ALTER COLUMN "permissionDbId" DROP NOT NULL,
-- ADD CONSTRAINT "TeamMemberDirectPermission_pkey" PRIMARY KEY ("id");

-- -- CreateIndex
-- CREATE UNIQUE INDEX "TeamMemberDirectPermission_projectId_projectUserId_teamId_p_key" ON "TeamMemberDirectPermission"("projectId", "projectUserId", "teamId", "permissionDbId");

-- -- CreateIndex
-- CREATE UNIQUE INDEX "TeamMemberDirectPermission_projectId_projectUserId_teamId_s_key" ON "TeamMemberDirectPermission"("projectId", "projectUserId", "teamId", "systemPermission");


-- Step 1: Add `id` as an optional column
ALTER TABLE "TeamMemberDirectPermission" 
ADD COLUMN "id" UUID, 
ADD COLUMN "systemPermission" "TeamSystemPermission";

-- Step 2: Populate the `id` column with UUID values
UPDATE "TeamMemberDirectPermission" SET "id" = gen_random_uuid();

-- Step 3: Make the `id` column required
ALTER TABLE "TeamMemberDirectPermission" ALTER COLUMN "id" SET NOT NULL;

-- Step 4: Ensure there are no duplicate values for the unique constraints
-- There should be no duplicates for the unique constraints

-- Step 5: Drop the existing primary key constraint
ALTER TABLE "TeamMemberDirectPermission" DROP CONSTRAINT "TeamMemberDirectPermission_pkey",
ALTER COLUMN "permissionDbId" DROP NOT NULL;

-- Step 6: Add the unique constraints
CREATE UNIQUE INDEX "TeamMemberDirectPermission_projectId_projectUserId_teamId_p_key" ON "TeamMemberDirectPermission"("projectId", "projectUserId", "teamId", "permissionDbId");
CREATE UNIQUE INDEX "TeamMemberDirectPermission_projectId_projectUserId_teamId_s_key" ON "TeamMemberDirectPermission"("projectId", "projectUserId", "teamId", "systemPermission");

-- Step 7: Add the new primary key constraint
ALTER TABLE "TeamMemberDirectPermission" ADD CONSTRAINT "TeamMemberDirectPermission_pkey" PRIMARY KEY ("id");