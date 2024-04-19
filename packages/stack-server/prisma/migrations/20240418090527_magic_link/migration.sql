-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN     "magicLinkEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable, authWithEmail default to true if password hash is set previously, otherwise false
ALTER TABLE "ProjectUser" ADD COLUMN "authWithEmail" BOOLEAN NOT NULL DEFAULT false;
UPDATE "ProjectUser" SET "authWithEmail" = true WHERE "passwordHash" IS NOT NULL;

-- CreateTable
CREATE TABLE "ProjectUserMagicLinkCode" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "redirectUrl" TEXT NOT NULL,
    "newUser" BOOLEAN NOT NULL,

    CONSTRAINT "ProjectUserMagicLinkCode_pkey" PRIMARY KEY ("projectId","code")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUserMagicLinkCode_code_key" ON "ProjectUserMagicLinkCode"("code");

-- AddForeignKey
ALTER TABLE "ProjectUserMagicLinkCode" ADD CONSTRAINT "ProjectUserMagicLinkCode_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE CASCADE ON UPDATE CASCADE;
