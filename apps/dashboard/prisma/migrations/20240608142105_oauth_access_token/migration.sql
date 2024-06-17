/*
  Warnings:

  - You are about to drop the column `providerRefreshToken` on the `ProjectUserOAuthAccount` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `StandardOAuthProviderConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProjectUserAuthorizationCode" ADD COLUMN     "afterCallbackRedirectUrl" TEXT;

-- AlterTable
ALTER TABLE "ProjectUserOAuthAccount" DROP COLUMN "providerRefreshToken";

-- AlterTable
ALTER TABLE "StandardOAuthProviderConfig" DROP COLUMN "tenantId";

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" UUID NOT NULL,
    "projectId" TEXT NOT NULL,
    "oAuthProviderConfigId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scopes" TEXT[],

    CONSTRAINT "OAuthToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD CONSTRAINT "OAuthToken_projectId_oAuthProviderConfigId_providerAccount_fkey" FOREIGN KEY ("projectId", "oAuthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("projectId", "oauthProviderConfigId", "providerAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;
