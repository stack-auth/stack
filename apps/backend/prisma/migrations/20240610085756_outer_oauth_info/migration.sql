-- CreateTable
CREATE TABLE "OAuthOuterInfo" (
    "id" UUID NOT NULL,
    "info" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthOuterInfo_pkey" PRIMARY KEY ("id")
);
