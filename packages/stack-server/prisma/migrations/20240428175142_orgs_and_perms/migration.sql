-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('GLOBAL', 'ORGANIZATION');

-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN     "organizationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "magicLinkEnabled" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProjectUser" ADD COLUMN     "organizationId" UUID,
ALTER COLUMN "authWithEmail" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProjectUserAuthorizationCode" ALTER COLUMN "newUser" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Organization" (
    "projectId" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("projectId","organizationId")
);

-- CreateTable
CREATE TABLE "Permission" (
    "queriableId" TEXT NOT NULL,
    "dbId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectConfigId" UUID,
    "projectId" TEXT,
    "organizationId" UUID,
    "scope" "PermissionScope" NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "PermissionEdge" (
    "edgeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentPermissionDbId" UUID NOT NULL,
    "childPermissionDbId" UUID NOT NULL,

    CONSTRAINT "PermissionEdge_pkey" PRIMARY KEY ("edgeId")
);

-- CreateTable
CREATE TABLE "ProjectUserDirectPermission" (
    "projectId" TEXT NOT NULL,
    "projectUserId" UUID NOT NULL,
    "permissionDbId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectUserDirectPermission_pkey" PRIMARY KEY ("projectId","projectUserId","permissionDbId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_projectConfigId_queriableId_key" ON "Permission"("projectConfigId", "queriableId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_projectId_organizationId_queriableId_key" ON "Permission"("projectId", "organizationId", "queriableId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_projectConfigId_fkey" FOREIGN KEY ("projectConfigId") REFERENCES "ProjectConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_projectId_organizationId_fkey" FOREIGN KEY ("projectId", "organizationId") REFERENCES "Organization"("projectId", "organizationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionEdge" ADD CONSTRAINT "PermissionEdge_parentPermissionDbId_fkey" FOREIGN KEY ("parentPermissionDbId") REFERENCES "Permission"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionEdge" ADD CONSTRAINT "PermissionEdge_childPermissionDbId_fkey" FOREIGN KEY ("childPermissionDbId") REFERENCES "Permission"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_projectId_organizationId_fkey" FOREIGN KEY ("projectId", "organizationId") REFERENCES "Organization"("projectId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserDirectPermission" ADD CONSTRAINT "ProjectUserDirectPermission_projectId_projectUserId_fkey" FOREIGN KEY ("projectId", "projectUserId") REFERENCES "ProjectUser"("projectId", "projectUserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUserDirectPermission" ADD CONSTRAINT "ProjectUserDirectPermission_permissionDbId_fkey" FOREIGN KEY ("permissionDbId") REFERENCES "Permission"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;
