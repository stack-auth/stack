/*
  Warnings:

  - You are about to drop the column `contactChannelId` on the `OtpAuthMethod` table. All the data in the column will be lost.
  - You are about to drop the column `identifier` on the `PasswordAuthMethod` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,type,value,usedForAuth]` on the table `ContactChannel` will be added. If there are existing duplicate values, this will fail.
  - You are about to drop the column `identifierType` on the `PasswordAuthMethod` table. All the data in the column will be lost.
  - You are about to drop the column `identifierType` on the `PasswordAuthMethodConfig` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OtpAuthMethod" DROP CONSTRAINT "OtpAuthMethod_projectId_projectUserId_contactChannelId_fkey";

-- DropIndex
DROP INDEX "OtpAuthMethod_projectId_contactChannelId_key";

-- DropIndex
DROP INDEX "PasswordAuthMethod_projectId_identifierType_identifier_key";

-- AlterTable
ALTER TABLE "ContactChannel" ADD COLUMN "usedForAuth" "BooleanTrue";

-- Set the usedForAuth value to "TRUE" if the contact channel is used in `OtpAuthMethod` or the value is the same as the `PasswordAuthMethod` of the same user
UPDATE "ContactChannel" cc
SET "usedForAuth" = 'TRUE'
WHERE EXISTS (
    SELECT 1
    FROM "OtpAuthMethod" oam
    WHERE oam."projectId" = cc."projectId"
    AND oam."projectUserId" = cc."projectUserId"
)
OR EXISTS (
    SELECT 1
    FROM "PasswordAuthMethod" pam
    WHERE pam."projectId" = cc."projectId"
    AND pam."projectUserId" = cc."projectUserId"
    AND pam."identifier" = cc."value"
);


-- AlterTable
ALTER TABLE "OtpAuthMethod" DROP COLUMN "contactChannelId";

-- AlterTable
ALTER TABLE "PasswordAuthMethod" DROP COLUMN "identifier";

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_projectId_type_value_usedForAuth_key" ON "ContactChannel"("projectId", "type", "value", "usedForAuth");

-- AlterTable
ALTER TABLE "PasswordAuthMethod" DROP COLUMN "identifierType";

-- AlterTable
ALTER TABLE "PasswordAuthMethodConfig" DROP COLUMN "identifierType";

-- DropEnum
DROP TYPE "PasswordAuthMethodIdentifierType";

-- CreateIndex
CREATE UNIQUE INDEX "OtpAuthMethod_projectId_projectUserId_key" ON "OtpAuthMethod"("projectId", "projectUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordAuthMethod_projectId_projectUserId_key" ON "PasswordAuthMethod"("projectId", "projectUserId");

