-- DropForeignKey
ALTER TABLE "OAuthProviderConfig" DROP CONSTRAINT "OAuthProviderConfig_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_configId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectConfigOverride" DROP CONSTRAINT "ProjectConfigOverride_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserOAuthAccount" DROP CONSTRAINT "ProjectUserOAuthAccount_projectConfigId_oauthProviderConfi_fkey";

-- DropForeignKey
ALTER TABLE "ProxiedOAuthProviderConfig" DROP CONSTRAINT "ProxiedOAuthProviderConfig_projectConfigId_id_fkey";

-- DropForeignKey
ALTER TABLE "StandardOAuthProviderConfig" DROP CONSTRAINT "StandardOAuthProviderConfig_projectConfigId_id_fkey";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectConfigOverride" ADD CONSTRAINT "ProjectConfigOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserOAuthAccount" ADD CONSTRAINT "ProjectUserOAuthAccount_projectConfigId_oauthProviderConfi_fkey" FOREIGN KEY ("projectConfigId", "oauthProviderConfigId") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthProviderConfig" ADD CONSTRAINT "OAuthProviderConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxiedOAuthProviderConfig" ADD CONSTRAINT "ProxiedOAuthProviderConfig_projectConfigId_id_fkey" FOREIGN KEY ("projectConfigId", "id") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardOAuthProviderConfig" ADD CONSTRAINT "StandardOAuthProviderConfig_projectConfigId_id_fkey" FOREIGN KEY ("projectConfigId", "id") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
