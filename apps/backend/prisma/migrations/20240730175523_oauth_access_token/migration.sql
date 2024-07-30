-- CreateTable
CREATE TABLE "OAuthAccessToken" (
    "id" UUID NOT NULL,
    "projectId" TEXT NOT NULL,
    "oAuthProviderConfigId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccessToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OAuthAccessToken" ADD CONSTRAINT "OAuthAccessToken_projectId_oAuthProviderConfigId_providerA_fkey" FOREIGN KEY ("projectId", "oAuthProviderConfigId", "providerAccountId") REFERENCES "ProjectUserOAuthAccount"("projectId", "oauthProviderConfigId", "providerAccountId") ON DELETE CASCADE ON UPDATE CASCADE;
