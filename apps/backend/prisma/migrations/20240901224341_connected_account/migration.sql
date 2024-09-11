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



-- Step 1: Drop constraints and foreign keys
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





-- Step 2: Create new stuff

-- CreateEnum
CREATE TYPE "ContactChannelType" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "PasswordAuthMethodIdentifierType" AS ENUM ('EMAIL');


-- CreateTable
CREATE TABLE "ContactChannel" (
    "projectId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ContactChannelType" NOT NULL,
    "isPrimary" "BooleanTrue",
    "isVerified" BOOLEAN NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ContactChannel_pkey" PRIMARY KEY ("projectId","projectUserId","id")
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
    "contactChannelId" UUID NOT NULL,
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

-- AlterTable
ALTER TABLE "OAuthProviderConfig" ADD COLUMN     "authMethodConfigId" UUID,
ADD COLUMN     "connectedAccountConfigId" UUID;









-- Step 3: Custom migrations

-- previously, all OAuthProviderConfig were AuthMethods and ConnectedAccountConfigs implicitly
-- this is now explicit, so set the authMethodConfigId and connectedAccountConfigId to newly created objects
-- Set authMethodConfigId and connectedAccountConfigId to unique UUIDs for each row
UPDATE "OAuthProviderConfig"
    SET "authMethodConfigId" = gen_random_uuid();
UPDATE "OAuthProviderConfig"
    SET "connectedAccountConfigId" = gen_random_uuid()
    FROM "StandardOAuthProviderConfig"
    WHERE "OAuthProviderConfig"."projectConfigId" = "StandardOAuthProviderConfig"."projectConfigId" AND "OAuthProviderConfig"."id" = "StandardOAuthProviderConfig"."id";

INSERT INTO "AuthMethodConfig" ("projectConfigId", "id", "createdAt", "updatedAt", "enabled")
    SELECT "projectConfigId", "authMethodConfigId", "createdAt", "updatedAt", "enabled" FROM "OAuthProviderConfig";
INSERT INTO "ConnectedAccountConfig" ("projectConfigId", "id", "createdAt", "updatedAt", "enabled")
    SELECT "projectConfigId", "connectedAccountConfigId", "createdAt", "updatedAt", "enabled"
        FROM "OAuthProviderConfig"
        WHERE "connectedAccountConfigId" IS NOT NULL;


-- previously, we had credentialEnabled and magicLinkEnabled on ProjectConfig
-- now, we have PasswordAuthMethodConfig and OtpAuthMethodConfig
INSERT INTO "PasswordAuthMethodConfig" ("projectConfigId", "authMethodConfigId", "createdAt", "updatedAt", "identifierType")
    SELECT "id", gen_random_uuid(), "createdAt", "updatedAt", 'EMAIL'
    FROM "ProjectConfig";
INSERT INTO "AuthMethodConfig" ("projectConfigId", "id", "createdAt", "updatedAt", "enabled")
    SELECT "projectConfigId", "authMethodConfigId", "PasswordAuthMethodConfig"."createdAt", "PasswordAuthMethodConfig"."updatedAt", ("ProjectConfig"."credentialEnabled" = true)
    FROM "PasswordAuthMethodConfig"
    LEFT JOIN "ProjectConfig" ON "PasswordAuthMethodConfig"."projectConfigId" = "ProjectConfig"."id";

INSERT INTO "OtpAuthMethodConfig" ("projectConfigId", "authMethodConfigId", "createdAt", "updatedAt", "contactChannelType")
    SELECT "id", gen_random_uuid(), "createdAt", "updatedAt", 'EMAIL'
    FROM "ProjectConfig";
INSERT INTO "AuthMethodConfig" ("projectConfigId", "id", "createdAt", "updatedAt", "enabled")
    SELECT "projectConfigId", "authMethodConfigId", "OtpAuthMethodConfig"."createdAt", "OtpAuthMethodConfig"."updatedAt", ("ProjectConfig"."magicLinkEnabled" = true)
    FROM "OtpAuthMethodConfig"
    LEFT JOIN "ProjectConfig" ON "OtpAuthMethodConfig"."projectConfigId" = "ProjectConfig"."id";


-- previously, we had primaryEmail and primaryEmailVerified on ProjectUser
-- now, we have ContactChannel
INSERT INTO "ContactChannel" ("projectId", "projectUserId", "id", "createdAt", "updatedAt", "type", "isPrimary", "isVerified", "value")
    SELECT "projectId", "projectUserId", gen_random_uuid(), "createdAt", "updatedAt", 'EMAIL', 'TRUE', "primaryEmailVerified", "primaryEmail"
    FROM "ProjectUser"
    WHERE "primaryEmail" IS NOT NULL;


-- previously, we had authWithEmail, passwordHash, and primaryEmail on ProjectUser
-- now, we have PasswordAuthMethod and OtpAuthMethod
INSERT INTO "PasswordAuthMethod" ("projectId", "authMethodId", "projectUserId", "createdAt", "updatedAt", "identifierType", "identifier", "passwordHash")
    SELECT "projectId", gen_random_uuid(), "projectUserId", "createdAt", "updatedAt", 'EMAIL', "primaryEmail", "passwordHash"
    FROM "ProjectUser"
    WHERE "authWithEmail" = true AND "passwordHash" IS NOT NULL;
INSERT INTO "AuthMethod" ("projectId", "id", "projectUserId", "authMethodConfigId", "projectConfigId", "createdAt", "updatedAt")
    SELECT "projectId", "authMethodId", "projectUserId", "PasswordAuthMethodConfig"."authMethodConfigId", "projectConfigId", "PasswordAuthMethod"."createdAt", "PasswordAuthMethod"."updatedAt"
    FROM "PasswordAuthMethod"
    LEFT JOIN "Project" ON "PasswordAuthMethod"."projectId" = "Project"."id"
    LEFT JOIN "ProjectConfig" ON "Project"."configId" = "ProjectConfig"."id"
    LEFT JOIN "PasswordAuthMethodConfig" ON "ProjectConfig"."id" = "PasswordAuthMethodConfig"."projectConfigId";


INSERT INTO "OtpAuthMethod" ("projectId", "authMethodId", "projectUserId", "createdAt", "updatedAt", "contactChannelId")
    SELECT "ProjectUser"."projectId", gen_random_uuid(), "ProjectUser"."projectUserId", "ProjectUser"."createdAt", "ProjectUser"."updatedAt", "ContactChannel"."id"
    FROM "ProjectUser"
    LEFT JOIN "ContactChannel" ON "ProjectUser"."projectId" = "ContactChannel"."projectId" AND "ProjectUser"."projectUserId" = "ContactChannel"."projectUserId" AND "ContactChannel"."isPrimary" = 'TRUE'
    WHERE "authWithEmail" = true;
INSERT INTO "AuthMethod" ("projectId", "id", "projectUserId", "authMethodConfigId", "projectConfigId", "createdAt", "updatedAt")
    SELECT "projectId", "authMethodId", "projectUserId", "OtpAuthMethodConfig"."authMethodConfigId", "projectConfigId", "OtpAuthMethod"."createdAt", "OtpAuthMethod"."updatedAt"
    FROM "OtpAuthMethod"
    LEFT JOIN "Project" ON "OtpAuthMethod"."projectId" = "Project"."id"
    LEFT JOIN "ProjectConfig" ON "Project"."configId" = "ProjectConfig"."id"
    LEFT JOIN "OtpAuthMethodConfig" ON "ProjectConfig"."id" = "OtpAuthMethodConfig"."projectConfigId";





-- Step 4: Drop stuff

-- AlterTable
ALTER TABLE "OAuthProviderConfig" DROP COLUMN "enabled";

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




-- Step 5: Add foreign keys and indices 

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_projectId_projectUserId_type_isPrimary_key" ON "ContactChannel"("projectId", "projectUserId", "type", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_projectId_projectUserId_type_value_key" ON "ContactChannel"("projectId", "projectUserId", "type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_projectId_oauthProviderConfigId_providerAc_key" ON "ConnectedAccount"("projectId", "oauthProviderConfigId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpAuthMethod_projectId_contactChannelId_key" ON "OtpAuthMethod"("projectId", "contactChannelId");

-- CreateIndex
-- CREATE UNIQUE INDEX "PasswordAuthMethod_projectId_identifierType_identifier_key" ON "PasswordAuthMethod"("projectId", "identifierType", "identifier");

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
ALTER TABLE "OtpAuthMethod" ADD CONSTRAINT "OtpAuthMethod_projectId_projectUserId_contactChannelId_fkey" FOREIGN KEY ("projectId", "projectUserId", "contactChannelId") REFERENCES "ContactChannel"("projectId", "projectUserId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

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

