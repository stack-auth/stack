/*
  Warnings:

  - You are about to drop the column `senderName` on the `EmailServiceConfig` table. All the data in the column will be lost.
  - Added the required column `senderName` to the `StandardEmailServiceConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailServiceConfig" DROP COLUMN "senderName";

-- AlterTable
ALTER TABLE "StandardEmailServiceConfig" ADD COLUMN     "senderName" TEXT NOT NULL;
