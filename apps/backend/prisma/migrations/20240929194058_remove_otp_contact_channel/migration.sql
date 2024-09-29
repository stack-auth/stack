/*
  Warnings:

  - You are about to drop the column `contactChannelId` on the `OtpAuthMethod` table. All the data in the column will be lost.
  - You are about to drop the column `identifier` on the `PasswordAuthMethod` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,type,value,usedForAuth]` on the table `ContactChannel` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "OtpAuthMethod" DROP CONSTRAINT "OtpAuthMethod_projectId_projectUserId_contactChannelId_fkey";

-- DropIndex
DROP INDEX "OtpAuthMethod_projectId_contactChannelId_key";

-- DropIndex
DROP INDEX "PasswordAuthMethod_projectId_identifierType_identifier_key";

-- AlterTable
ALTER TABLE "ContactChannel" ADD COLUMN "usedForAuth" "BooleanTrue";

-- AlterTable
ALTER TABLE "OtpAuthMethod" DROP COLUMN "contactChannelId";

-- AlterTable
ALTER TABLE "PasswordAuthMethod" DROP COLUMN "identifier";

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_projectId_type_value_usedForAuth_key" ON "ContactChannel"("projectId", "type", "value", "usedForAuth");
