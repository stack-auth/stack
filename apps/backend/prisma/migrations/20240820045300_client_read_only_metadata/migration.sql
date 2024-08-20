-- AlterTable
ALTER TABLE "ProjectUser" ADD COLUMN     "clientReadOnlyMetadata" JSONB;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "clientMetadata" JSONB,
ADD COLUMN     "clientReadOnlyMetadata" JSONB,
ADD COLUMN     "serverMetadata" JSONB;
