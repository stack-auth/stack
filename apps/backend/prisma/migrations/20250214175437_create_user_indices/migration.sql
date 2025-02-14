-- CreateIndex
CREATE INDEX "AuthMethod_tenancyId_projectUserId_idx" ON "AuthMethod"("tenancyId", "projectUserId");

-- CreateIndex
CREATE INDEX "PermissionEdge_parentPermissionDbId_idx" ON "PermissionEdge"("parentPermissionDbId");

-- CreateIndex
CREATE INDEX "PermissionEdge_childPermissionDbId_idx" ON "PermissionEdge"("childPermissionDbId");

-- CreateIndex
CREATE INDEX "ProjectUserOAuthAccount_tenancyId_projectUserId_idx" ON "ProjectUserOAuthAccount"("tenancyId", "projectUserId");
