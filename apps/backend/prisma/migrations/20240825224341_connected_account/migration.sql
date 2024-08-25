/*
  Warnings:

  - You are about to drop the column `enabled` on the `OAuthProviderConfig` table. All the data in the column will be lost.
  - You are about to drop the column `credentialEnabled` on the `ProjectConfig` table. All the data in the column will be lost.
  - You are about to drop the column `magicLinkEnabled` on the `ProjectConfig` table. All the data in the column will be lost.
  - You are about to drop the column `authWithEmail` on the `ProjectUser` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `ProjectUser` table. All the data in the column will be lost.
  - You are about to drop the column `primaryEmail` on the `ProjectUser` table. All the data in the column will be lost.
  - You are about to drop the column `primaryEmailVerified` on the `ProjectUser` table. All the data in the column will be lost.
  - You are about to drop the `ProjectUserEmailVerificationCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectUserMagicLinkCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectUserPasswordResetCode` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectConfigId,authMethodConfigId]` on the table `OAuthProviderConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectConfigId,connectedAccountConfigId]` on the table `OAuthProviderConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectConfigId,clientId]` on the table `StandardOAuthProviderConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ContactChannelType" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "PasswordAuthMethodIdentifierType" AS ENUM ('EMAIL');

-- DropForeignKey
ALTER TABLE "OAuthProviderConfig" DROP CONSTRAINT "OAuthProviderConfig_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserEmailVerificationCode" DROP CONSTRAINT "ProjectUserEmailVerificationCode_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserMagicLinkCode" DROP CONSTRAINT "ProjectUserMagicLinkCode_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserOAuthAccount" DROP CONSTRAINT "ProjectUserOAuthAccount_projectConfigId_oauthProviderConfi_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserPasswordResetCode" DROP CONSTRAINT "ProjectUserPasswordResetCode_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "StandardOAuthProviderConfig" DROP CONSTRAINT "StandardOAuthProviderConfig_projectConfigId_id_fkey";

-- AlterTable
ALTER TABLE "OAuthProviderConfig" DROP COLUMN "enabled",
ADD COLUMN     "authMethodConfigId" UUID,
ADD COLUMN     "connectedAccountConfigId" UUID;

-- AlterTable
ALTER TABLE "ProjectConfig" DROP COLUMN "credentialEnabled",
DROP COLUMN "magicLinkEnabled";

-- AlterTable
ALTER TABLE "ProjectUser" DROP COLUMN "authWithEmail",
DROP COLUMN "passwordHash",
DROP COLUMN "primaryEmail",
DROP COLUMN "primaryEmailVerified";

-- DropTable
DROP TABLE "ProjectUserEmailVerificationCode";

-- DropTable
DROP TABLE "ProjectUserMagicLinkCode";

-- DropTable
DROP TABLE "ProjectUserPasswordResetCode";

-- CreateTable
CREATE TABLE "ContactChannel" (
    "projectId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "projectConfigId" UUID NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ContactChannelType" NOT NULL,
    "isPrimary" "BooleanTrue",
    "isVerified" BOOLEAN NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ContactChannel_pkey" PRIMARY KEY ("projectId","id")
);

-- CreateTable
CREATE TABLE "ConnectedAccountConfig" (
    "projectConfigId" UUID NOT NULL,
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConnectedAccountConfig_pkey" PRIMARY KEY ("projectConfigId","id")
);

-- CreateTable
CREATE TABLE "ConnectedAccount" (
    "projectId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "projectConfigId" UUID NOT NULL,
    "connectedAccountConfigId" UUID NOT NULL,
    "projectUserId" UUID NOT NULL,
    "oauthProviderConfigId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("projectId","id")
);

-- CreateTable
CREATE TABLE "AuthMethodConfig" (
    "projectConfigId" UUID NOT NULL,
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AuthMethodConfig_pkey" PRIMARY KEY ("projectConfigId","id")
);

-- CreateTable
CREATE TABLE "OtpAuthMethodConfig" (
    "projectConfigId" UUID NOT NULL,
    "authMethodConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactChannelType" "ContactChannelType" NOT NULL,

    CONSTRAINT "OtpAuthMethodConfig_pkey" PRIMARY KEY ("projectConfigId","authMethodConfigId")
);

-- CreateTable
CREATE TABLE "PasswordAuthMethodConfig" (
    "projectConfigId" UUID NOT NULL,
    "authMethodConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "identifierType" "PasswordAuthMethodIdentifierType" NOT NULL,

    CONSTRAINT "PasswordAuthMethodConfig_pkey" PRIMARY KEY ("projectConfigId","authMethodConfigId")
);

-- CreateTable
CREATE TABLE "AuthMethod" (
    "projectId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "projectUserId" UUID NOT NULL,
    "authMethodId" UUID NOT NULL,
    "authMethodConfigId" UUID NOT NULL,
    "projectConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthMethod_pkey" PRIMARY KEY ("projectId","id")
);

-- CreateTable
CREATE TABLE "OtpAuthMethod" (
    "projectId" TEXT NOT NULL,
    "authMethodId" UUID NOT NULL,
    "contactChannelValue" TEXT NOT NULL,
    "contactChannelType" "ContactChannelType" NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpAuthMethod_pkey" PRIMARY KEY ("projectId","authMethodId")
);

-- CreateTable
CREATE TABLE "PasswordAuthMethod" (
    "projectId" TEXT NOT NULL,
    "authMethodId" UUID NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "identifierType" "PasswordAuthMethodIdentifierType" NOT NULL,
    "identifier" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "PasswordAuthMethod_pkey" PRIMARY KEY ("projectId","authMethodId")
);

-- CreateTable
CREATE TABLE "OAuthAuthMethod" (
    "projectId" TEXT NOT NULL,
    "projectConfigId" UUID NOT NULL,
    "authMethodId" UUID NOT NULL,
    "oauthProviderConfigId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAuthMethod_pkey" PRIMARY KEY ("projectId","authMethodId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_projectId_projectUserId_type_isPrimary_key" ON "ContactChannel"("projectId", "projectUserId", "type", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_projectId_projectUserId_type_value_key" ON "ContactChannel"("projectId", "projectUserId", "type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_projectId_oauthProviderConfigId_providerAc_key" ON "ConnectedAccount"("projectId", "oauthProviderConfigId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpAuthMethod_projectId_contactChannelType_contactChannelVa_key" ON "OtpAuthMethod"("projectId", "contactChannelType", "contactChannelValue");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordAuthMethod_projectId_identifierType_identifier_key" ON "PasswordAuthMethod"("projectId", "identifierType", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAuthMethod_projectId_oauthProviderConfigId_providerAcc_key" ON "OAuthAuthMethod"("projectId", "oauthProviderConfigId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthProviderConfig_projectConfigId_authMethodConfigId_key" ON "OAuthProviderConfig"("projectConfigId", "authMethodConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthProviderConfig_projectConfigId_connectedAccountConfigI_key" ON "OAuthProviderConfig"("projectConfigId", "connectedAccountConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "StandardOAuthProviderConfig_projectConfigId_clientId_key" ON "StandardOAuthProviderConfig"("projectConfigId", "clientId");

-- AddForeignKey
ALTER TABLE "ProjectUserOAuthAccount" ADD CONSTRAINT "ProjectUserOAuthAccount_projectConfigId_oauthProviderConfi_fkey" FOREIGN KEY ("projectConfigId", "oauthProviderConfigId") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactChannel" ADD CONSTRAINT "ContactChannel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactChannel" ADD CONSTRAINT "ContactChannel_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccountConfig" ADD CONSTRAINT "ConnectedAccountConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_projectId_oauthProviderConfigId_providerA_fkey" FOREIGN KEY ("projectId", "oauthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("projectId", "oauthProviderConfigId", "providerAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_projectConfigId_connectedAccountConfigId_fkey" FOREIGN KEY ("projectConfigId", "connectedAccountConfigId") REFERENCES "ConnectedAccountConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_projectConfigId_oauthProviderConfigId_fkey" FOREIGN KEY ("projectConfigId", "oauthProviderConfigId") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthMethodConfig" ADD CONSTRAINT "AuthMethodConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpAuthMethodConfig" ADD CONSTRAINT "OtpAuthMethodConfig_projectConfigId_authMethodConfigId_fkey" FOREIGN KEY ("projectConfigId", "authMethodConfigId") REFERENCES "AuthMethodConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordAuthMethodConfig" ADD CONSTRAINT "PasswordAuthMethodConfig_projectConfigId_authMethodConfigI_fkey" FOREIGN KEY ("projectConfigId", "authMethodConfigId") REFERENCES "AuthMethodConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthProviderConfig" ADD CONSTRAINT "OAuthProviderConfig_projectConfigId_authMethodConfigId_fkey" FOREIGN KEY ("projectConfigId", "authMethodConfigId") REFERENCES "AuthMethodConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthProviderConfig" ADD CONSTRAINT "OAuthProviderConfig_projectConfigId_connectedAccountConfig_fkey" FOREIGN KEY ("projectConfigId", "connectedAccountConfigId") REFERENCES "ConnectedAccountConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthProviderConfig" ADD CONSTRAINT "OAuthProviderConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardOAuthProviderConfig" ADD CONSTRAINT "StandardOAuthProviderConfig_projectConfigId_id_fkey" FOREIGN KEY ("projectConfigId", "id") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthMethod" ADD CONSTRAINT "AuthMethod_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthMethod" ADD CONSTRAINT "AuthMethod_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthMethod" ADD CONSTRAINT "AuthMethod_projectConfigId_authMethodConfigId_fkey" FOREIGN KEY ("projectConfigId", "authMethodConfigId") REFERENCES "AuthMethodConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpAuthMethod" ADD CONSTRAINT "OtpAuthMethod_projectId_projectUserId_contactChannelType_c_fkey" FOREIGN KEY ("projectId", "projectUserId", "contactChannelType", "contactChannelValue") REFERENCES "ContactChannel"("projectId", "projectUserId", "type", "value") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpAuthMethod" ADD CONSTRAINT "OtpAuthMethod_projectId_authMethodId_fkey" FOREIGN KEY ("projectId", "authMethodId") REFERENCES "AuthMethod"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpAuthMethod" ADD CONSTRAINT "OtpAuthMethod_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordAuthMethod" ADD CONSTRAINT "PasswordAuthMethod_projectId_authMethodId_fkey" FOREIGN KEY ("projectId", "authMethodId") REFERENCES "AuthMethod"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordAuthMethod" ADD CONSTRAINT "PasswordAuthMethod_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_projectId_authMethodId_fkey" FOREIGN KEY ("projectId", "authMethodId") REFERENCES "AuthMethod"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_projectId_oauthProviderConfigId_providerAc_fkey" FOREIGN KEY ("projectId", "oauthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("projectId", "oauthProviderConfigId", "providerAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_projectConfigId_oauthProviderConfigId_fkey" FOREIGN KEY ("projectConfigId", "oauthProviderConfigId") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
