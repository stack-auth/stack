-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN     "legacyGlobalJwtSigning" BOOLEAN NOT NULL DEFAULT false;

-- Update existing rows
UPDATE "ProjectConfig" SET "legacyGlobalJwtSigning" = true;