-- AlterTable
ALTER TABLE "ProjectUser" ADD COLUMN     "selectedTeamId" UUID;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_projectId_selectedTeamId_fkey" FOREIGN KEY ("projectId", "selectedTeamId") REFERENCES "Team"("projectId", "teamId") ON DELETE RESTRICT ON UPDATE CASCADE;
