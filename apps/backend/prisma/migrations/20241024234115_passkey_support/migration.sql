-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VerificationCodeType" ADD VALUE 'PASSKEY_REGISTRATION_CHALLENGE';
ALTER TYPE "VerificationCodeType" ADD VALUE 'PASSKEY_AUTHENTICATION_CHALLENGE';

-- CreateTable
CREATE TABLE "PasskeyAuthMethodConfig" (
    "projectConfigId" UUID NOT NULL,
    "authMethodConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasskeyAuthMethodConfig_pkey" PRIMARY KEY ("projectConfigId","authMethodConfigId")
);

-- CreateTable
CREATE TABLE "PasskeyAuthMethod" (
    "projectId" TEXT NOT NULL,
    "authMethodId" UUID NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "userHandle" TEXT NOT NULL,
    "transports" TEXT[],
    "credentialDeviceType" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,

    CONSTRAINT "PasskeyAuthMethod_pkey" PRIMARY KEY ("projectId","authMethodId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyAuthMethod_projectId_projectUserId_key" ON "PasskeyAuthMethod"("projectId", "projectUserId");

-- AddForeignKey
ALTER TABLE "PasskeyAuthMethodConfig" ADD CONSTRAINT "PasskeyAuthMethodConfig_projectConfigId_authMethodConfigId_fkey" FOREIGN KEY ("projectConfigId", "authMethodConfigId") REFERENCES "AuthMethodConfig"("projectConfigId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasskeyAuthMethod" ADD CONSTRAINT "PasskeyAuthMethod_projectId_authMethodId_fkey" FOREIGN KEY ("projectId", "authMethodId") REFERENCES "AuthMethod"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasskeyAuthMethod" ADD CONSTRAINT "PasskeyAuthMethod_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;
