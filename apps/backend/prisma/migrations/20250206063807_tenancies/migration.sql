-- DropForeignKey
ALTER TABLE "AuthMethod" DROP CONSTRAINT "AuthMethod_projectId_fkey";

-- DropForeignKey
ALTER TABLE "AuthMethod" DROP CONSTRAINT "AuthMethod_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "ConnectedAccount" DROP CONSTRAINT "ConnectedAccount_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ConnectedAccount" DROP CONSTRAINT "ConnectedAccount_projectId_oauthProviderConfigId_providerA_fkey";

-- DropForeignKey
ALTER TABLE "ConnectedAccount" DROP CONSTRAINT "ConnectedAccount_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "ContactChannel" DROP CONSTRAINT "ContactChannel_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ContactChannel" DROP CONSTRAINT "ContactChannel_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "OAuthAccessToken" DROP CONSTRAINT "OAuthAccessToken_projectId_oAuthProviderConfigId_providerA_fkey";

-- DropForeignKey
ALTER TABLE "OAuthAuthMethod" DROP CONSTRAINT "OAuthAuthMethod_projectId_authMethodId_fkey";

-- DropForeignKey
ALTER TABLE "OAuthAuthMethod" DROP CONSTRAINT "OAuthAuthMethod_projectId_oauthProviderConfigId_providerAc_fkey";

-- DropForeignKey
ALTER TABLE "OAuthAuthMethod" DROP CONSTRAINT "OAuthAuthMethod_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "OAuthToken" DROP CONSTRAINT "OAuthToken_projectId_oAuthProviderConfigId_providerAccount_fkey";

-- DropForeignKey
ALTER TABLE "OtpAuthMethod" DROP CONSTRAINT "OtpAuthMethod_projectId_authMethodId_fkey";

-- DropForeignKey
ALTER TABLE "OtpAuthMethod" DROP CONSTRAINT "OtpAuthMethod_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "PasskeyAuthMethod" DROP CONSTRAINT "PasskeyAuthMethod_projectId_authMethodId_fkey";

-- DropForeignKey
ALTER TABLE "PasskeyAuthMethod" DROP CONSTRAINT "PasskeyAuthMethod_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordAuthMethod" DROP CONSTRAINT "PasswordAuthMethod_projectId_authMethodId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordAuthMethod" DROP CONSTRAINT "PasswordAuthMethod_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_projectId_teamId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectConfigOverride" DROP CONSTRAINT "ProjectConfigOverride_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUser" DROP CONSTRAINT "ProjectUser_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserAuthorizationCode" DROP CONSTRAINT "ProjectUserAuthorizationCode_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserOAuthAccount" DROP CONSTRAINT "ProjectUserOAuthAccount_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserRefreshToken" DROP CONSTRAINT "ProjectUserRefreshToken_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_projectId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_projectId_projectUserId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_projectId_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMemberDirectPermission" DROP CONSTRAINT "TeamMemberDirectPermission_projectId_projectUserId_teamId_fkey";

-- DropIndex
DROP INDEX "ConnectedAccount_projectId_oauthProviderConfigId_providerAc_key";

-- DropIndex
DROP INDEX "ContactChannel_projectId_projectUserId_type_isPrimary_key";

-- DropIndex
DROP INDEX "ContactChannel_projectId_projectUserId_type_value_key";

-- DropIndex
DROP INDEX "ContactChannel_projectId_type_value_usedForAuth_key";

-- DropIndex
DROP INDEX "OAuthAuthMethod_projectId_oauthProviderConfigId_providerAcc_key";

-- DropIndex
DROP INDEX "OtpAuthMethod_projectId_projectUserId_key";

-- DropIndex
DROP INDEX "PasskeyAuthMethod_projectId_projectUserId_key";

-- DropIndex
DROP INDEX "PasswordAuthMethod_projectId_projectUserId_key";

-- DropIndex
DROP INDEX "Permission_projectId_teamId_queryableId_key";

-- DropIndex
DROP INDEX "ProjectUser_createdAt_asc";

-- DropIndex
DROP INDEX "ProjectUser_createdAt_desc";

-- DropIndex
DROP INDEX "ProjectUser_displayName_asc";

-- DropIndex
DROP INDEX "ProjectUser_displayName_desc";

-- DropIndex
DROP INDEX "TeamMember_projectId_projectUserId_isSelected_key";

-- DropIndex
DROP INDEX "TeamMemberDirectPermission_projectId_projectUserId_teamId_p_key";

-- DropIndex
DROP INDEX "TeamMemberDirectPermission_projectId_projectUserId_teamId_s_key";

-- Create a Tenancy table
CREATE TABLE "Tenancy" (
  "id" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projectId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "organizationId" UUID,
  "hasNoOrganization" "BooleanTrue",

  CONSTRAINT "Tenancy_pkey" PRIMARY KEY ("id")
);

-- Create a Tenancy for each Project (using branch 'main' and no organization)
INSERT INTO "Tenancy" (id, "createdAt", "updatedAt", "projectId", "branchId", "organizationId", "hasNoOrganization")
SELECT gen_random_uuid(), now(), now(), id, 'main', NULL, 'TRUE'
FROM "Project";

/* ===== Update AuthMethod table ===== */
ALTER TABLE "AuthMethod" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "AuthMethod"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "AuthMethod"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "AuthMethod" DROP CONSTRAINT "AuthMethod_pkey";
ALTER TABLE "AuthMethod" DROP COLUMN "projectId";
ALTER TABLE "AuthMethod" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "AuthMethod" ADD CONSTRAINT "AuthMethod_pkey" PRIMARY KEY ("tenancyId", "id");

/* ===== Update ConnectedAccount table ===== */
ALTER TABLE "ConnectedAccount" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "ConnectedAccount"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "ConnectedAccount"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "ConnectedAccount" DROP CONSTRAINT "ConnectedAccount_pkey";
ALTER TABLE "ConnectedAccount" DROP COLUMN "projectId";
ALTER TABLE "ConnectedAccount" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("tenancyId", "id");

/* ===== Update ContactChannel table ===== */
ALTER TABLE "ContactChannel" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "ContactChannel"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "ContactChannel"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "ContactChannel" DROP CONSTRAINT "ContactChannel_pkey";
ALTER TABLE "ContactChannel" DROP COLUMN "projectId";
ALTER TABLE "ContactChannel" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "ContactChannel" ADD CONSTRAINT "ContactChannel_pkey" PRIMARY KEY ("tenancyId", "projectUserId", "id");

/* ===== Update OAuthAccessToken table ===== */
ALTER TABLE "OAuthAccessToken" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "OAuthAccessToken"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "OAuthAccessToken"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "OAuthAccessToken" DROP COLUMN "projectId";
ALTER TABLE "OAuthAccessToken" RENAME COLUMN "tenancyId_temp" TO "tenancyId";

/* ===== Update OAuthAuthMethod table ===== */
ALTER TABLE "OAuthAuthMethod" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "OAuthAuthMethod"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "OAuthAuthMethod"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "OAuthAuthMethod" DROP CONSTRAINT "OAuthAuthMethod_pkey";
ALTER TABLE "OAuthAuthMethod" DROP COLUMN "projectId";
ALTER TABLE "OAuthAuthMethod" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_pkey" PRIMARY KEY ("tenancyId", "authMethodId");

/* ===== Update OAuthToken table ===== */
ALTER TABLE "OAuthToken" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "OAuthToken"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "OAuthToken"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "OAuthToken" DROP COLUMN "projectId";
ALTER TABLE "OAuthToken" RENAME COLUMN "tenancyId_temp" TO "tenancyId";

/* ===== Update OtpAuthMethod table ===== */
ALTER TABLE "OtpAuthMethod" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "OtpAuthMethod"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "OtpAuthMethod"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "OtpAuthMethod" DROP CONSTRAINT "OtpAuthMethod_pkey";
ALTER TABLE "OtpAuthMethod" DROP COLUMN "projectId";
ALTER TABLE "OtpAuthMethod" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "OtpAuthMethod" ADD CONSTRAINT "OtpAuthMethod_pkey" PRIMARY KEY ("tenancyId", "authMethodId");

/* ===== Update PasskeyAuthMethod table ===== */
ALTER TABLE "PasskeyAuthMethod" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "PasskeyAuthMethod"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "PasskeyAuthMethod"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "PasskeyAuthMethod" DROP CONSTRAINT "PasskeyAuthMethod_pkey";
ALTER TABLE "PasskeyAuthMethod" DROP COLUMN "projectId";
ALTER TABLE "PasskeyAuthMethod" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "PasskeyAuthMethod" ADD CONSTRAINT "PasskeyAuthMethod_pkey" PRIMARY KEY ("tenancyId", "authMethodId");

/* ===== Update PasswordAuthMethod table ===== */
ALTER TABLE "PasswordAuthMethod" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "PasswordAuthMethod"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "PasswordAuthMethod"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "PasswordAuthMethod" DROP CONSTRAINT "PasswordAuthMethod_pkey";
ALTER TABLE "PasswordAuthMethod" DROP COLUMN "projectId";
ALTER TABLE "PasswordAuthMethod" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "PasswordAuthMethod" ADD CONSTRAINT "PasswordAuthMethod_pkey" PRIMARY KEY ("tenancyId", "authMethodId");

/* ===== Update Permission table ===== */
ALTER TABLE "Permission" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "Permission"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "Permission"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "Permission" DROP COLUMN "projectId";
ALTER TABLE "Permission" RENAME COLUMN "tenancyId_temp" TO "tenancyId";

/* ===== Update ProjectUser table ===== */
ALTER TABLE "ProjectUser" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "ProjectUser"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "ProjectUser"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "ProjectUser" DROP CONSTRAINT "ProjectUser_pkey";
ALTER TABLE "ProjectUser" DROP COLUMN "projectId";
ALTER TABLE "ProjectUser" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_pkey" PRIMARY KEY ("tenancyId", "projectUserId");

/* ===== Update ProjectUserAuthorizationCode table ===== */
ALTER TABLE "ProjectUserAuthorizationCode" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "ProjectUserAuthorizationCode"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "ProjectUserAuthorizationCode"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "ProjectUserAuthorizationCode" DROP CONSTRAINT "ProjectUserAuthorizationCode_pkey";
ALTER TABLE "ProjectUserAuthorizationCode" DROP COLUMN "projectId";
ALTER TABLE "ProjectUserAuthorizationCode" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "ProjectUserAuthorizationCode" ADD CONSTRAINT "ProjectUserAuthorizationCode_pkey" PRIMARY KEY ("tenancyId", "authorizationCode");

/* ===== Update ProjectUserOAuthAccount table ===== */
ALTER TABLE "ProjectUserOAuthAccount" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "ProjectUserOAuthAccount"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "ProjectUserOAuthAccount"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "ProjectUserOAuthAccount" DROP CONSTRAINT "ProjectUserOAuthAccount_pkey";
ALTER TABLE "ProjectUserOAuthAccount" DROP COLUMN "projectId";
ALTER TABLE "ProjectUserOAuthAccount" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "ProjectUserOAuthAccount" ADD CONSTRAINT "ProjectUserOAuthAccount_pkey" PRIMARY KEY ("tenancyId", "oauthProviderConfigId", "providerAccountId");

/* ===== Update ProjectUserRefreshToken table ===== */
ALTER TABLE "ProjectUserRefreshToken" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "ProjectUserRefreshToken"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "ProjectUserRefreshToken"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "ProjectUserRefreshToken" DROP CONSTRAINT "ProjectUserRefreshToken_pkey";
ALTER TABLE "ProjectUserRefreshToken" DROP COLUMN "projectId";
ALTER TABLE "ProjectUserRefreshToken" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "ProjectUserRefreshToken" ADD CONSTRAINT "ProjectUserRefreshToken_pkey" PRIMARY KEY ("tenancyId", "refreshToken");

/* ===== Update Team table ===== */
ALTER TABLE "Team" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "Team"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "Team"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "Team" DROP CONSTRAINT "Team_pkey";
ALTER TABLE "Team" DROP COLUMN "projectId";
ALTER TABLE "Team" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "Team" ADD CONSTRAINT "Team_pkey" PRIMARY KEY ("tenancyId", "teamId");

/* ===== Update TeamMember table ===== */
ALTER TABLE "TeamMember" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "TeamMember"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "TeamMember"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_pkey";
ALTER TABLE "TeamMember" DROP COLUMN "projectId";
ALTER TABLE "TeamMember" RENAME COLUMN "tenancyId_temp" TO "tenancyId";
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("tenancyId", "projectUserId", "teamId");

/* ===== Update TeamMemberDirectPermission table ===== */
ALTER TABLE "TeamMemberDirectPermission" ADD COLUMN "tenancyId_temp" UUID;
UPDATE "TeamMemberDirectPermission"
SET "tenancyId_temp" = t.id
FROM "Tenancy" t
WHERE t."projectId" = "TeamMemberDirectPermission"."projectId" AND t."branchId" = 'main' AND t."organizationId" IS NULL;
ALTER TABLE "TeamMemberDirectPermission" DROP COLUMN "projectId";
ALTER TABLE "TeamMemberDirectPermission" RENAME COLUMN "tenancyId_temp" TO "tenancyId";

-- DropTable
DROP TABLE "ProjectConfigOverride";

-- CreateIndex
CREATE UNIQUE INDEX "Tenancy_projectId_branchId_organizationId_key" ON "Tenancy"("projectId", "branchId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenancy_projectId_branchId_hasNoOrganization_key" ON "Tenancy"("projectId", "branchId", "hasNoOrganization");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_tenancyId_oauthProviderConfigId_providerAc_key" ON "ConnectedAccount"("tenancyId", "oauthProviderConfigId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_tenancyId_projectUserId_type_isPrimary_key" ON "ContactChannel"("tenancyId", "projectUserId", "type", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_tenancyId_projectUserId_type_value_key" ON "ContactChannel"("tenancyId", "projectUserId", "type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_tenancyId_type_value_usedForAuth_key" ON "ContactChannel"("tenancyId", "type", "value", "usedForAuth");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAuthMethod_tenancyId_oauthProviderConfigId_providerAcc_key" ON "OAuthAuthMethod"("tenancyId", "oauthProviderConfigId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpAuthMethod_tenancyId_projectUserId_key" ON "OtpAuthMethod"("tenancyId", "projectUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyAuthMethod_tenancyId_projectUserId_key" ON "PasskeyAuthMethod"("tenancyId", "projectUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordAuthMethod_tenancyId_projectUserId_key" ON "PasswordAuthMethod"("tenancyId", "projectUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_tenancyId_teamId_queryableId_key" ON "Permission"("tenancyId", "teamId", "queryableId");

-- CreateIndex
CREATE INDEX "ProjectUser_displayName_asc" ON "ProjectUser"("tenancyId", "displayName" ASC);

-- CreateIndex
CREATE INDEX "ProjectUser_displayName_desc" ON "ProjectUser"("tenancyId", "displayName" DESC);

-- CreateIndex
CREATE INDEX "ProjectUser_createdAt_asc" ON "ProjectUser"("tenancyId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ProjectUser_createdAt_desc" ON "ProjectUser"("tenancyId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_tenancyId_projectUserId_isSelected_key" ON "TeamMember"("tenancyId", "projectUserId", "isSelected");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMemberDirectPermission_tenancyId_projectUserId_teamId_p_key" ON "TeamMemberDirectPermission"("tenancyId", "projectUserId", "teamId", "permissionDbId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMemberDirectPermission_tenancyId_projectUserId_teamId_s_key" ON "TeamMemberDirectPermission"("tenancyId", "projectUserId", "teamId", "systemPermission");

-- AddForeignKey
ALTER TABLE "Tenancy" ADD CONSTRAINT "Tenancy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_tenancyId_teamId_fkey" FOREIGN KEY ("tenancyId", "teamId") REFERENCES "Team"("tenancyId", "teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberDirectPermission" ADD CONSTRAINT "TeamMemberDirectPermission_tenancyId_projectUserId_teamId_fkey" FOREIGN KEY ("tenancyId", "projectUserId", "teamId") REFERENCES "TeamMember"("tenancyId", "projectUserId", "teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_tenancyId_teamId_fkey" FOREIGN KEY ("tenancyId", "teamId") REFERENCES "Team"("tenancyId", "teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserOAuthAccount" ADD CONSTRAINT "ProjectUserOAuthAccount_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactChannel" ADD CONSTRAINT "ContactChannel_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactChannel" ADD CONSTRAINT "ContactChannel_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_tenancyId_oauthProviderConfigId_providerA_fkey" FOREIGN KEY ("tenancyId", "oauthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("tenancyId", "oauthProviderConfigId", "providerAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthMethod" ADD CONSTRAINT "AuthMethod_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthMethod" ADD CONSTRAINT "AuthMethod_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpAuthMethod" ADD CONSTRAINT "OtpAuthMethod_tenancyId_authMethodId_fkey" FOREIGN KEY ("tenancyId", "authMethodId") REFERENCES "AuthMethod"("tenancyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpAuthMethod" ADD CONSTRAINT "OtpAuthMethod_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordAuthMethod" ADD CONSTRAINT "PasswordAuthMethod_tenancyId_authMethodId_fkey" FOREIGN KEY ("tenancyId", "authMethodId") REFERENCES "AuthMethod"("tenancyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordAuthMethod" ADD CONSTRAINT "PasswordAuthMethod_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasskeyAuthMethod" ADD CONSTRAINT "PasskeyAuthMethod_tenancyId_authMethodId_fkey" FOREIGN KEY ("tenancyId", "authMethodId") REFERENCES "AuthMethod"("tenancyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasskeyAuthMethod" ADD CONSTRAINT "PasskeyAuthMethod_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_tenancyId_authMethodId_fkey" FOREIGN KEY ("tenancyId", "authMethodId") REFERENCES "AuthMethod"("tenancyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_tenancyId_oauthProviderConfigId_providerAc_fkey" FOREIGN KEY ("tenancyId", "oauthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("tenancyId", "oauthProviderConfigId", "providerAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAuthMethod" ADD CONSTRAINT "OAuthAuthMethod_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD CONSTRAINT "OAuthToken_tenancyId_oAuthProviderConfigId_providerAccount_fkey" FOREIGN KEY ("tenancyId", "oAuthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("tenancyId", "oauthProviderConfigId", "providerAccountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccessToken" ADD CONSTRAINT "OAuthAccessToken_tenancyId_oAuthProviderConfigId_providerA_fkey" FOREIGN KEY ("tenancyId", "oAuthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("tenancyId", "oauthProviderConfigId", "providerAccountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserRefreshToken" ADD CONSTRAINT "ProjectUserRefreshToken_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserAuthorizationCode" ADD CONSTRAINT "ProjectUserAuthorizationCode_tenancyId_projectUserId_fkey" FOREIGN KEY ("tenancyId", "projectUserId") REFERENCES "ProjectUser"("tenancyId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;
