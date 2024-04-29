import { prismaClient } from "@/prisma-client";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { PermissionJson, PermissionScopeJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerPermissionCreateJson, ServerPermissionJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";

export const fullPermissionInclude = {
  parentEdges: {
    include: {
      parentPermission: true,
    },
  },
} as const satisfies Prisma.PermissionInclude;


function serverPermissionJsonFromDbType(db: any): ServerPermissionJson {
  if (!db.projectConfigId && !db.organizationId) throw new StackAssertionError(`Permission DB object should have either projectConfigId or organizationId`, { db });
  if (db.projectConfigId && db.organizationId) throw new StackAssertionError(`Permission DB object should have either projectConfigId or organizationId, not both`, { db });
  if (db.scope === "GLOBAL" && db.organizationId) throw new StackAssertionError(`Permission DB object should not have organizationId when scope is GLOBAL`, { db });

  return {
    databaseUniqueId: db.dbId,
    id: db.queriableId,
    scope: 
      db.scope === "GLOBAL" ? { type: "global" } :
        db.organizationId ? { type: "specific-organization", organizationId: db.organizationId } :
          db.projectConfigId ? { type: "any-organization" } :
            throwErr(new StackAssertionError(`Unexpected permission scope`, { db })), 
    displayName: db.displayName,
    description: db.description,
    inheritFromPermissionIds: db.parentEdges.map((edge: any) => edge.parentPermission.queriableId),
  };
}


export async function listPermissions(projectId: string, scope: PermissionScopeJson): Promise<PermissionJson[]> {
  const serverPermissions = await listServerPermissions(projectId, scope);
  return serverPermissions.map(permission => ({
    id: permission.id,
    scope: permission.scope,
  }));
}

export async function listServerPermissions(projectId: string, scope: PermissionScopeJson): Promise<ServerPermissionJson[]> {
  let res;
  switch (scope.type) {
    case "specific-organization": {
      const organization = await prismaClient.organization.findUnique({
        where: {
          projectId_organizationId: {
            projectId,
            organizationId: scope.organizationId,
          },
        },
        include: {
          permissions: {
            include: fullPermissionInclude,
          },
        },
      });
      if (!organization) throw new KnownErrors.OrganizationNotFound(scope.organizationId);
      res = organization.permissions;
      break;
    }
    case "global":
    case "any-organization": {
      res = await prismaClient.permission.findMany({
        where: {
          projectId,
          scope: scope.type === "global" ? "GLOBAL" : "ORGANIZATION",
        },
        include: fullPermissionInclude,
      });
      break;
    }
  }
  return res.map(serverPermissionJsonFromDbType);
}

export async function userHasPermission(projectId: string, userId: string, scope: PermissionScopeJson, permissionId: string) {
  // TODO optimize
  const allUserPermissions = await listUserPermissionsRecursive(projectId, userId, scope);
  const permission = allUserPermissions.find(p => p.id === permissionId);
  if (!permission) {
    // maybe we can throw a better error message than "not found" (but be careful not to leak information as other organizations' permissions should be private)
    let tryScope: PermissionScopeJson | undefined;
    if (scope.type === "global") tryScope = { type: "any-organization" };
    else if (scope.type === "any-organization") tryScope = { type: "global" };
    if (tryScope) {
      const allUserPermissionsWrongScope = await listUserPermissionsRecursive(projectId, userId, tryScope);
      if (allUserPermissionsWrongScope.find(p => p.id === permissionId)) {
        throw new KnownErrors.PermissionScopeMismatch(permissionId, tryScope, scope);
      }
    }

    throw new KnownErrors.PermissionNotFound(permissionId);
  }
  return permission;
}

export async function updateUserDirectPermissions(projectId: string, userId: string, scope: PermissionScopeJson, permissionsToUpdate: { id: string, set: boolean }[]) {
  // TODO optimize
  const allPermissions = await listServerPermissions(projectId, scope);
  for (const { id: permissionId, set } of permissionsToUpdate) {
    const permission = allPermissions.find(p => p.id === permissionId);
    if (!permission) throw new KnownErrors.PermissionNotFound(permissionId);

    if (set) {
      await prismaClient.projectUserDirectPermission.upsert({
        where: {
          projectId_projectUserId_permissionDbId: {
            projectId,
            projectUserId: userId,
            permissionDbId: permissionId,
          },
        },
        create: {
          projectId,
          projectUserId: userId,
          permissionDbId: permissionId,
        },
        update: {},
      });
    } else {
      await prismaClient.projectUserDirectPermission.deleteMany({
        where: {
          projectId,
          projectUserId: userId,
          permissionDbId: permissionId,
        },
      });
    }
  }
}

export async function listUserPermissionsRecursive(projectId: string, userId: string, scope: PermissionScopeJson): Promise<ServerPermissionJson[]> {
  const allPermissions = await listServerPermissions(projectId, scope);
  const permissionsMap = new Map(allPermissions.map(p => [p.id, p]));

  const user = await prismaClient.projectUser.findUnique({
    where: {
      projectId_projectUserId: {
        projectId,
        projectUserId: userId,
      },
    },
    include: {
      directPermissions: {
        select: {
          permissionDbId: true,
        },
      },
    },
  });  

  if (!user) throw new KnownErrors.UserNotFound();

  const result = new Map<string, ServerPermissionJson>();
  const idsToProcess = [...user.directPermissions.map(p => p.permissionDbId)];
  while (idsToProcess.length > 0) {
    const currentId = idsToProcess.pop()!;
    const current = permissionsMap.get(currentId);
    if (!current) throw new StackAssertionError(`Couldn't find permission in DB?`, { currentId, result, idsToProcess });
    if (result.has(current.id)) continue;
    result.set(current.id, current);
    idsToProcess.push(...current.inheritFromPermissionIds);
  }
  return [...result.values()];
}

export async function listPotentialParentPermissions(projectId: string, scope: PermissionScopeJson): Promise<ServerPermissionJson[]> {
  const scopes: PermissionScopeJson[] = [
    { type: "global" } as const,
    ...scope.type === "global" ? [] : [
      { type: "any-organization" } as const,
      ...scope.type === "any-organization" ? [] : [
        { type: "specific-organization", organizationId: scope.organizationId } as const,
      ],
    ],
  ];
  return (await Promise.all(scopes.map(s => listServerPermissions(projectId, s)))).flat(1);
}

export async function createPermission(projectId: string, scope: PermissionScopeJson, permission: ServerPermissionCreateJson) {
  const project = await prismaClient.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!project) throw new KnownErrors.ProjectNotFound();

  let parentDbIds = [];
  const potentialParentPermissions = await listPotentialParentPermissions(projectId, scope);
  for (const parentPermissionId of permission.inheritFromPermissionIds) {
    const parentPermission = potentialParentPermissions.find(p => p.id === parentPermissionId);
    if (!parentPermission) throw new KnownErrors.PermissionNotFound(parentPermissionId);
    parentDbIds.push(parentPermission.databaseUniqueId);
  }
  await prismaClient.permission.create({
    data: {
      scope: scope.type === "global" ? "GLOBAL" : "ORGANIZATION",
      queriableId: permission.id,
      displayName: permission.displayName,
      description: permission.description,
      ...scope.type === "specific-organization" ? {
        projectId: project.id,
        organizationId: scope.organizationId,
      } : {
        projectConfigId: project.configId,
      },
      parentEdges: {
        create: parentDbIds.map(parentDbId => ({
          parentPermission: {
            connect: {
              dbId: parentDbId,
            },
          },
        })),
      },
    },
  });
}

export async function deletePermission(projectId: string, scope: PermissionScopeJson, permissionId: string) {
  switch (scope.type) {
    case "global":
    case "any-organization": {
      const project = await prismaClient.project.findUnique({
        where: {
          id: projectId,
        },
      });
      if (!project) throw new KnownErrors.ProjectNotFound();
      const deleted = await prismaClient.permission.delete({
        where: {
          projectConfigId_queriableId: {
            projectConfigId: project.configId,
            queriableId: permissionId,
          },
        },
      });
      if (!deleted) throw new KnownErrors.PermissionNotFound(permissionId);
      break;
    }
    case "specific-organization": {
      const organization = await prismaClient.organization.findUnique({
        where: {
          projectId_organizationId: {
            projectId,
            organizationId: scope.organizationId,
          },
        },
      });
      if (!organization) throw new KnownErrors.OrganizationNotFound(scope.organizationId);
      const deleted = await prismaClient.permission.delete({
        where: {
          projectId_organizationId_queriableId: {
            projectId,
            queriableId: permissionId,
            organizationId: scope.organizationId,
          },
        },
      });
      if (!deleted) throw new KnownErrors.PermissionNotFound(permissionId);
      break;
    }
  }
}
