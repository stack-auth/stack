/*
  Warnings:

  - A unique constraint covering the columns `[projectId,identifierType,identifier]` on the table `PasswordAuthMethod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PasswordAuthMethod_projectId_identifierType_identifier_key" ON "PasswordAuthMethod"("projectId", "identifierType", "identifier");
