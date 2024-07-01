/*
  Warnings:

  - You are about to drop the column `selectedTeamId` on the `ProjectUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,projectUserId,isSelected]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BooleanTrue" AS ENUM ('TRUE');

-- DropForeignKey
ALTER TABLE "ApiKeySet" DROP CONSTRAINT "ApiKeySet_projectId_fkey";

-- DropForeignKey
ALTER TABLE "OAuthToken" DROP CONSTRAINT "OAuthToken_projectId_oAuthProviderConfigId_providerAccount_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_projectId_teamId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUser" DROP CONSTRAINT "ProjectUser_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUser" DROP CONSTRAINT "ProjectUser_projectId_selectedTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_projectId_fkey";

-- AlterTable
ALTER TABLE "ProjectUser" DROP COLUMN "selectedTeamId";

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "isSelected" "BooleanTrue";

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_projectId_projectUserId_isSelected_key" ON "TeamMember"("projectId", "projectUserId", "isSelected");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_projectId_teamId_fkey" FOREIGN KEY ("projectId", "teamId") REFERENCES "Team"("projectId", "teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD CONSTRAINT "OAuthToken_projectId_oAuthProviderConfigId_providerAccount_fkey" FOREIGN KEY ("projectId", "oAuthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("projectId", "oauthProviderConfigId", "providerAccountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeySet" ADD CONSTRAINT "ApiKeySet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
