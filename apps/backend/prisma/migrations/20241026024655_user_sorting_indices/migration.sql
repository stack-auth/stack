-- CreateIndex
CREATE INDEX "ProjectUser_displayName_asc" ON "ProjectUser"("projectId", "displayName" ASC);

-- CreateIndex
CREATE INDEX "ProjectUser_displayName_desc" ON "ProjectUser"("projectId", "displayName" DESC);

-- CreateIndex
CREATE INDEX "ProjectUser_createdAt_asc" ON "ProjectUser"("projectId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ProjectUser_createdAt_desc" ON "ProjectUser"("projectId", "createdAt" DESC);
