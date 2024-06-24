/*
  Warnings:

  - A unique constraint covering the columns `[projectId,projectUserId,selected]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "selected" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_projectId_projectUserId_selected_key" ON "TeamMember"("projectId", "projectUserId", "selected");
