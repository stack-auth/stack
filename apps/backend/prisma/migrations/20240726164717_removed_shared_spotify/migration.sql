/*
  Warnings:

  - The values [SPOTIFY] on the enum `ProxiedOAuthProviderType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProxiedOAuthProviderType_new" AS ENUM ('GITHUB', 'FACEBOOK', 'GOOGLE', 'MICROSOFT');
ALTER TABLE "ProxiedOAuthProviderConfig" ALTER COLUMN "type" TYPE "ProxiedOAuthProviderType_new" USING ("type"::text::"ProxiedOAuthProviderType_new");
ALTER TYPE "ProxiedOAuthProviderType" RENAME TO "ProxiedOAuthProviderType_old";
ALTER TYPE "ProxiedOAuthProviderType_new" RENAME TO "ProxiedOAuthProviderType";
DROP TYPE "ProxiedOAuthProviderType_old";
COMMIT;
