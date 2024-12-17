-- AlterEnum
ALTER TYPE "VerificationCodeType" ADD VALUE 'NEON_INTEGRATION_PROJECT_TRANSFER';

-- CreateTable
CREATE TABLE "NeonProvisionedProject" (
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "neonClientId" TEXT NOT NULL,

    CONSTRAINT "NeonProvisionedProject_pkey" PRIMARY KEY ("projectId")
);

-- AddForeignKey
ALTER TABLE "NeonProvisionedProject" ADD CONSTRAINT "NeonProvisionedProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
