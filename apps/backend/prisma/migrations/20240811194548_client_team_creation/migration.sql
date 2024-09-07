-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN "clientTeamCreationEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Update existing rows
UPDATE "ProjectConfig" SET "clientTeamCreationEnabled" = false;

-- Remove the default constraint
ALTER TABLE "ProjectConfig" ALTER COLUMN "clientTeamCreationEnabled" DROP DEFAULT;