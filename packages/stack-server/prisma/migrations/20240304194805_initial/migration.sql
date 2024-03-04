-- CreateEnum
CREATE TYPE "ProxiedOauthProviderType" AS ENUM ('GITHUB', 'FACEBOOK', 'SLACK', 'TWITTER', 'LINKEDIN', 'GOOGLE', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "StandardOauthProviderType" AS ENUM ('GITHUB', 'FACEBOOK', 'SLACK', 'TWITTER', 'LINKEDIN', 'GOOGLE', 'MICROSOFT');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "configId" UUID NOT NULL,
    "isProductionMode" BOOLEAN NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectConfig" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "allowLocalhost" BOOLEAN NOT NULL,

    CONSTRAINT "ProjectConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDomain" (
    "projectConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,
    "handlerPath" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectConfigOverride" (
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectConfigOverride_pkey" PRIMARY KEY ("projectId")
);

-- CreateTable
CREATE TABLE "ProjectUser" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "primaryEmail" TEXT,
    "primaryEmailVerified" BOOLEAN NOT NULL,
    "profileImageUrl" TEXT,
    "displayName" TEXT,
    "passwordHash" TEXT,
    "serverMetadata" JSONB,
    "clientMetadata" JSONB,

    CONSTRAINT "ProjectUser_pkey" PRIMARY KEY ("projectId","projectUserId")
);

-- CreateTable
CREATE TABLE "ProjectUserOauthAccount" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "projectConfigId" UUID NOT NULL,
    "oauthProviderConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "providerAccountId" TEXT NOT NULL,
    "providerRefreshToken" TEXT,

    CONSTRAINT "ProjectUserOauthAccount_pkey" PRIMARY KEY ("projectId","oauthProviderConfigId","providerAccountId")
);

-- CreateTable
CREATE TABLE "ProjectUserRefreshToken" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ProjectUserRefreshToken_pkey" PRIMARY KEY ("projectId","refreshToken")
);

-- CreateTable
CREATE TABLE "ProjectUserAuthorizationCode" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorizationCode" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,

    CONSTRAINT "ProjectUserAuthorizationCode_pkey" PRIMARY KEY ("projectId","authorizationCode")
);

-- CreateTable
CREATE TABLE "ProjectUserEmailVerificationCode" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "redirectUrl" TEXT NOT NULL,

    CONSTRAINT "ProjectUserEmailVerificationCode_pkey" PRIMARY KEY ("projectId","code")
);

-- CreateTable
CREATE TABLE "ProjectUserPasswordResetCode" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "redirectUrl" TEXT NOT NULL,

    CONSTRAINT "ProjectUserPasswordResetCode_pkey" PRIMARY KEY ("projectId","code")
);

-- CreateTable
CREATE TABLE "ApiKeySet" (
    "projectId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "manuallyRevokedAt" TIMESTAMP(3),
    "publishableClientKey" TEXT,
    "secretServerKey" TEXT,
    "superSecretAdminKey" TEXT,

    CONSTRAINT "ApiKeySet_pkey" PRIMARY KEY ("projectId","id")
);

-- CreateTable
CREATE TABLE "EmailServiceConfig" (
    "projectConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderName" TEXT NOT NULL,

    CONSTRAINT "EmailServiceConfig_pkey" PRIMARY KEY ("projectConfigId")
);

-- CreateTable
CREATE TABLE "ProxiedEmailServiceConfig" (
    "projectConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProxiedEmailServiceConfig_pkey" PRIMARY KEY ("projectConfigId")
);

-- CreateTable
CREATE TABLE "StandardEmailServiceConfig" (
    "projectConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "StandardEmailServiceConfig_pkey" PRIMARY KEY ("projectConfigId")
);

-- CreateTable
CREATE TABLE "OauthProviderConfig" (
    "projectConfigId" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OauthProviderConfig_pkey" PRIMARY KEY ("projectConfigId","id")
);

-- CreateTable
CREATE TABLE "ProxiedOauthProviderConfig" (
    "projectConfigId" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ProxiedOauthProviderType" NOT NULL,

    CONSTRAINT "ProxiedOauthProviderConfig_pkey" PRIMARY KEY ("projectConfigId","id")
);

-- CreateTable
CREATE TABLE "StandardOauthProviderConfig" (
    "projectConfigId" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "StandardOauthProviderType" NOT NULL,
    "tenantId" TEXT,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,

    CONSTRAINT "StandardOauthProviderConfig_pkey" PRIMARY KEY ("projectConfigId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDomain_projectConfigId_domain_key" ON "ProjectDomain"("projectConfigId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUserRefreshToken_refreshToken_key" ON "ProjectUserRefreshToken"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUserAuthorizationCode_authorizationCode_key" ON "ProjectUserAuthorizationCode"("authorizationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUserEmailVerificationCode_code_key" ON "ProjectUserEmailVerificationCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUserPasswordResetCode_code_key" ON "ProjectUserPasswordResetCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeySet_publishableClientKey_key" ON "ApiKeySet"("publishableClientKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeySet_secretServerKey_key" ON "ApiKeySet"("secretServerKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeySet_superSecretAdminKey_key" ON "ApiKeySet"("superSecretAdminKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProxiedOauthProviderConfig_projectConfigId_type_key" ON "ProxiedOauthProviderConfig"("projectConfigId", "type");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ProjectConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDomain" ADD CONSTRAINT "ProjectDomain_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectConfigOverride" ADD CONSTRAINT "ProjectConfigOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserOauthAccount" ADD CONSTRAINT "ProjectUserOauthAccount_projectConfigId_oauthProviderConfi_fkey" FOREIGN KEY ("projectConfigId", "oauthProviderConfigId") REFERENCES "OauthProviderConfig"("projectConfigId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserOauthAccount" ADD CONSTRAINT "ProjectUserOauthAccount_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserRefreshToken" ADD CONSTRAINT "ProjectUserRefreshToken_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserAuthorizationCode" ADD CONSTRAINT "ProjectUserAuthorizationCode_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserEmailVerificationCode" ADD CONSTRAINT "ProjectUserEmailVerificationCode_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserPasswordResetCode" ADD CONSTRAINT "ProjectUserPasswordResetCode_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeySet" ADD CONSTRAINT "ApiKeySet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfig" ADD CONSTRAINT "EmailServiceConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxiedEmailServiceConfig" ADD CONSTRAINT "ProxiedEmailServiceConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "EmailServiceConfig"("projectConfigId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardEmailServiceConfig" ADD CONSTRAINT "StandardEmailServiceConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "EmailServiceConfig"("projectConfigId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OauthProviderConfig" ADD CONSTRAINT "OauthProviderConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxiedOauthProviderConfig" ADD CONSTRAINT "ProxiedOauthProviderConfig_projectConfigId_id_fkey" FOREIGN KEY ("projectConfigId", "id") REFERENCES "OauthProviderConfig"("projectConfigId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardOauthProviderConfig" ADD CONSTRAINT "StandardOauthProviderConfig_projectConfigId_id_fkey" FOREIGN KEY ("projectConfigId", "id") REFERENCES "OauthProviderConfig"("projectConfigId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
