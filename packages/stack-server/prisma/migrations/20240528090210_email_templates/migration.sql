-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'MAGIC_LINK');

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "projectConfigId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "type" "EmailTemplateType" NOT NULL,
    "subject" TEXT NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("projectConfigId","type")
);

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "EmailServiceConfig"("projectConfigId") ON DELETE RESTRICT ON UPDATE CASCADE;
