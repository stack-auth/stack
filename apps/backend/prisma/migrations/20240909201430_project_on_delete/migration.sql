-- DropForeignKey
ALTER TABLE "OAuthProviderConfig" DROP CONSTRAINT "OAuthProviderConfig_projectConfigId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectUserOAuthAccount" DROP CONSTRAINT "ProjectUserOAuthAccount_projectConfigId_oauthProviderConfi_fkey";

-- DropForeignKey
ALTER TABLE "StandardOAuthProviderConfig" DROP CONSTRAINT "StandardOAuthProviderConfig_projectConfigId_id_fkey";

-- AddForeignKey
ALTER TABLE "ProjectUserOAuthAccount" ADD CONSTRAINT "ProjectUserOAuthAccount_projectConfigId_oauthProviderConfi_fkey" FOREIGN KEY ("projectConfigId", "oauthProviderConfigId") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthProviderConfig" ADD CONSTRAINT "OAuthProviderConfig_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardOAuthProviderConfig" ADD CONSTRAINT "StandardOAuthProviderConfig_projectConfigId_id_fkey" FOREIGN KEY ("projectConfigId", "id") REFERENCES "OAuthProviderConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
