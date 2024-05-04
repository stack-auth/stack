import { prismaClient } from "@/prisma-client";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { PermissionDefinitionJson, PermissionDefinitionScopeJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerPermissionCustomizableJson, ServerPermissionDefinitionJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";

export const fullPermissionInclude = {
  parentEdges: {
    include: {
      parentPermission: true,
    },
  },
} as const satisfies Prisma.PermissionInclude;


function serverPermissionDefinitionJsonFromDbType(
  db: Prisma.PermissionGetPayload<{ include: typeof fullPermissionInclude }>
): ServerPermissionDefinitionJson {
  if (!db.projectConfigId && !db.teamId) throw new StackAssertionError(`Permission DB object should have either projectConfigId or teamId`, { db });
  if (db.projectConfigId && db.teamId) throw new StackAssertionError(`Permission DB object should have either projectConfigId or teamId, not both`, { db });
  if (db.scope === "GLOBAL" && db.teamId) throw new StackAssertionError(`Permission DB object should not have teamId when scope is GLOBAL`, { db });

  return {
    __databaseUniqueId: db.dbId,
    id: db.queriableId,
    scope: 
      db.scope === "GLOBAL" ? { type: "global" } :
        db.teamId ? { type: "specific-team", teamId: db.teamId } :
          db.projectConfigId ? { type: "any-team" } :
            throwErr(new StackAssertionError(`Unexpected permission scope`, { db })), 
    description: db.description || undefined,
    inheritFromPermissionIds: db.parentEdges.map((edge) => edge.parentPermission.queriableId),
  };
}


export async function listPermissions(projectId: string, scope: PermissionDefinitionScopeJson): Promise<PermissionDefinitionJson[]> {
  const serverPermissions = await listServerPermissions(projectId, scope);
  return serverPermissions.map(permission => ({
    id: permission.id,
    scope: permission.scope,
  }));
}

export async function listServerPermissions(projectId: string, scope?: PermissionDefinitionScopeJson): Promise<ServerPermissionDefinitionJson[]> {
  switch (scope?.type) {
    case "specific-team": {
      const team = await prismaClient.team.findUnique({
        where: {
          projectId_teamId: {
            projectId,
            teamId: scope.teamId,
          },
        },
        include: {
          permissions: {
            include: fullPermissionInclude,
          },
        },
      });
      if (!team) throw new KnownErrors.TeamNotFound(scope.teamId);
      return team.permissions.map(serverPermissionDefinitionJsonFromDbType);
    }
    case "global":
    case "any-team": {
      const res = await prismaClient.permission.findMany({
        where: {
          projectConfig: {
            projects: {
              some: {
                id: projectId,
              }
            }
          },
          scope: scope.type === "global" ? "GLOBAL" : "TEAM",
        },
        include: fullPermissionInclude,
      });
      return res.map(serverPermissionDefinitionJsonFromDbType);
    }
    case undefined: {
      const res = await prismaClient.permission.findMany({
        where: {
          projectConfig: {
            projects: {
              some: {
                id: projectId,
              }
            }
          },
        },
        include: fullPermissionInclude,
      });
      return res.map(serverPermissionDefinitionJsonFromDbType);
    }
  }
}

export async function userHasPermission(
  projectId: string, 
  userId: string, 
  teamId: string,
  scope: PermissionDefinitionScopeJson, 
  permissionId: string
) {
  // TODO optimize
  const allUserPermissions = await listUserPermissionsRecursive(projectId, userId, teamId, scope);
  const permission = allUserPermissions.find(p => p.id === permissionId);
  if (!permission) {
    // maybe we can throw a better error message than "not found" (but be careful not to leak information as other teams' permissions should be private)
    let tryScope: PermissionDefinitionScopeJson | undefined;
    if (scope.type === "global") tryScope = { type: "any-team" };
    else if (scope.type === "any-team") tryScope = { type: "global" };
    if (tryScope) {
      const allUserPermissionsWrongScope = await listUserPermissionsRecursive(projectId, userId, teamId, tryScope);
      if (allUserPermissionsWrongScope.find(p => p.id === permissionId)) {
        throw new KnownErrors.PermissionScopeMismatch(permissionId, tryScope, scope);
      }
    }

    throw new KnownErrors.PermissionNotFound(permissionId);
  }
  return permission;
}

export async function updateTeamMemberDirectPermissions(
  projectId: string,
  teamId: string, 
  userId: string,
  scope: PermissionDefinitionScopeJson, 
  directPermissionIds: string[]
) {
  // TODO optimize
  const allPermissions = await listServerPermissions(projectId, scope);
  for (const permissionId of directPermissionIds) {
    const permission = allPermissions.find(p => p.id === permissionId);
    if (!permission) throw new KnownErrors.PermissionNotFound(permissionId);
  }

  // delete all existing permissions and add the new ones
  await prismaClient.teamMember.update({
    where: {
      projectId_projectUserId_teamId: {
        projectId,
        projectUserId: userId,
        teamId,
      },
    },
    data: {
      directPermissions: {
        deleteMany: {},
        create: directPermissionIds.map(permissionId => ({
          permission: {
            connect: {
              projectConfigId_queriableId: {
                projectConfigId: projectId,
                queriableId: permissionId,
              },
            },
          },
        })),
      },
    },
  });
}

export async function listUserPermissionsRecursive(
  projectId: string, 
  teamId: string,
  userId: string, 
  scope: PermissionDefinitionScopeJson
): Promise<ServerPermissionDefinitionJson[]> {
  const allPermissions = await listServerPermissions(projectId, scope);
  const permissionsMap = new Map(allPermissions.map(p => [p.id, p]));

  const user = await prismaClient.teamMember.findUnique({
    where: {
      projectId_projectUserId_teamId: {
        projectId,
        projectUserId: userId,
        teamId,
      },
    },
    include: {
      directPermissions: true,
    },
  });  

  if (!user) throw new KnownErrors.UserNotFound();

  const result = new Map<string, ServerPermissionDefinitionJson>();
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

export async function listPotentialParentPermissions(projectId: string, scope: PermissionDefinitionScopeJson): Promise<ServerPermissionDefinitionJson[]> {
  const scopes: PermissionDefinitionScopeJson[] = [
    { type: "global" } as const,
    ...scope.type === "global" ? [] : [
      { type: "any-team" } as const,
      ...scope.type === "any-team" ? [] : [
        { type: "specific-team", teamId: scope.teamId } as const,
      ],
    ],
  ];
  return (await Promise.all(scopes.map(s => listServerPermissions(projectId, s)))).flat(1);
}

export async function createPermission(
  projectId: string, 
  scope: PermissionDefinitionScopeJson, 
  permission: ServerPermissionCustomizableJson
): Promise<ServerPermissionDefinitionJson> {
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
    parentDbIds.push(parentPermission.__databaseUniqueId);
  }
  const dbPermission = await prismaClient.permission.create({
    data: {
      scope: scope.type === "global" ? "GLOBAL" : "TEAM",
      queriableId: permission.id,
      description: permission.description,
      ...scope.type === "specific-team" ? {
        projectId: project.id,
        teamId: scope.teamId,
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
    include: fullPermissionInclude,
  });
  return serverPermissionDefinitionJsonFromDbType(dbPermission);
}

export async function updatePermission(
  projectId: string, 
  scope: PermissionDefinitionScopeJson, 
  permissionId: string, 
  permission: Partial<ServerPermissionCustomizableJson>
): Promise<ServerPermissionDefinitionJson> {
  const project = await prismaClient.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!project) throw new KnownErrors.ProjectNotFound();

  let parentDbIds: string[] = [];
  if (permission.inheritFromPermissionIds) {
    const potentialParentPermissions = await listPotentialParentPermissions(projectId, scope);
    for (const parentPermissionId of permission.inheritFromPermissionIds) {
      const parentPermission = potentialParentPermissions.find(p => p.id === parentPermissionId);
      if (!parentPermission) throw new KnownErrors.PermissionNotFound(parentPermissionId);
      parentDbIds.push(parentPermission.__databaseUniqueId);
    }
  }

  let edgeUpdateData = {};
  if (permission.inheritFromPermissionIds) {
    edgeUpdateData = {
      parentEdges: {
        deleteMany: {},
        create: parentDbIds.map(parentDbId => ({
          parentPermission: {
            connect: {
              dbId: parentDbId,
            },
          },
        })),
      },
    };
  }

  const dbPermission = await prismaClient.permission.update({
    where: {
      projectConfigId_queriableId: {
        projectConfigId: project.configId,
        queriableId: permissionId,
      },
    },
    data: {
      queriableId: permission.id,
      description: permission.description,
      ...edgeUpdateData,
    },
    include: fullPermissionInclude,
  });
  return serverPermissionDefinitionJsonFromDbType(dbPermission);
}

export async function deletePermission(projectId: string, scope: PermissionDefinitionScopeJson, permissionId: string) {
  switch (scope.type) {
    case "global":
    case "any-team": {
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
    case "specific-team": {
      const team = await prismaClient.team.findUnique({
        where: {
          projectId_teamId: {
            projectId,
            teamId: scope.teamId,
          },
        },
      });
      if (!team) throw new KnownErrors.TeamNotFound(scope.teamId);
      const deleted = await prismaClient.permission.delete({
        where: {
          projectId_teamId_queriableId: {
            projectId,
            queriableId: permissionId,
            teamId: scope.teamId,
          },
        },
      });
      if (!deleted) throw new KnownErrors.PermissionNotFound(permissionId);
      break;
    }
  }
}
