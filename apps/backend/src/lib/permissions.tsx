import { prismaClient } from "@/prisma-client";
import { TeamSystemPermission as DBTeamSystemPermission, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { PermissionDefinitionScopeJson, ProjectJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase, typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";

export const teamPermissionIdSchema = yupString()
  .matches(/^\$?[a-z0-9_:]+$/, 'Only lowercase letters, numbers, ":", "_" and optional "$" at the beginning are allowed')
  .test('is-system-permission', 'System permissions must start with a dollar sign', (value, ctx) => {
    if (!value) return true;
    if (value.startsWith('$') && !isTeamSystemPermission(value)) {
      return ctx.createError({ message: 'Invalid system permission' });
    }
    return true;
  });


export const fullPermissionInclude = {
  parentEdges: {
    include: {
      parentPermission: true,
    },
  },
} as const satisfies Prisma.PermissionInclude;

export function isTeamSystemPermission(permission: string): permission is `$${Lowercase<DBTeamSystemPermission>}` {
  return permission.startsWith('$') && permission.slice(1).toUpperCase() in DBTeamSystemPermission;
}

export function teamSystemPermissionStringToDBType(permission: `$${Lowercase<DBTeamSystemPermission>}`): DBTeamSystemPermission {
  return typedToUppercase(permission.slice(1)) as DBTeamSystemPermission;
}

export function teamDBTypeToSystemPermissionString(permission: DBTeamSystemPermission): `$${Lowercase<DBTeamSystemPermission>}` {
  return '$' + typedToLowercase(permission) as `$${Lowercase<DBTeamSystemPermission>}`;
}

const descriptionMap: Record<DBTeamSystemPermission, string> = {
  "UPDATE_TEAM": "Update the team information",
  "DELETE_TEAM": "Delete the team",
  "READ_MEMBERS": "Read and list the other members of the team",
  "REMOVE_MEMBERS": "Remove other members from the team",
  "INVITE_MEMBERS": "Invite other users to the team",
};

export function permissionDefinitionJsonFromDbType(
  db: Prisma.PermissionGetPayload<{ include: typeof fullPermissionInclude }>
) {
  if (!db.projectConfigId && !db.teamId) throw new StackAssertionError(`Permission DB object should have either projectConfigId or teamId`, { db });
  if (db.projectConfigId && db.teamId) throw new StackAssertionError(`Permission DB object should have either projectConfigId or teamId, not both`, { db });
  if (db.scope === "GLOBAL" && db.teamId) throw new StackAssertionError(`Permission DB object should not have teamId when scope is GLOBAL`, { db });

  return {
    __database_id: db.dbId,
    id: db.queryableId,
    description: db.description || undefined,
    contained_permission_ids: db.parentEdges.map((edge) => {
      if (edge.parentPermission) {
        return edge.parentPermission.queryableId;
      } else if (edge.parentTeamSystemPermission) {
        return '$' + typedToLowercase(edge.parentTeamSystemPermission);
      } else {
        throw new StackAssertionError(`Permission edge should have either parentPermission or parentSystemPermission`, { edge });
      }
    }),
    scope: db.scope === "GLOBAL" ? { type: "global" } : 
      db.teamId ? { type: "specific-team", teamId: db.teamId } : 
        { type: "any-team" },
  } as const;
}

export function permissionDefinitionJsonFromTeamSystemDbType(
  db: DBTeamSystemPermission,
) {
  return {
    __database_id: '$' + typedToLowercase(db),
    id: '$' + typedToLowercase(db),
    scope: { type: "any-team" },
    description: descriptionMap[db],
    contained_permission_ids: [],
  } as const;
}

async function getParentDbIds(project: ProjectJson, containedPermissionIds?: string[]) {
  let parentDbIds = [];
  const potentialParentPermissions = await listPotentialParentPermissions(project, { type: "any-team" });
  for (const parentPermissionId of containedPermissionIds || []) {
    const parentPermission = potentialParentPermissions.find(p => p.id === parentPermissionId);
    if (!parentPermission) {
      throw new KnownErrors.PermissionNotFound(parentPermissionId);
    }
    parentDbIds.push(parentPermission.__database_id);
  }

  return parentDbIds;
}

export async function listPermissionDefinitions(project: ProjectJson, scope?: PermissionDefinitionScopeJson) {
  const results = [];
  switch (scope?.type) {
    case "specific-team": {
      const team = await prismaClient.team.findUnique({
        where: {
          projectId_teamId: {
            projectId: project.id,
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
      results.push(...team.permissions.map(permissionDefinitionJsonFromDbType));
      break;
    }
    case "global":
    case "any-team": {
      const res = await prismaClient.permission.findMany({
        where: {
          projectConfig: {
            projects: {
              some: {
                id: project.id,
              }
            }
          },
          scope: scope.type === "global" ? "GLOBAL" : "TEAM",
        },
        include: fullPermissionInclude,
      });
      results.push(...res.map(permissionDefinitionJsonFromDbType));
      break;
    }
    case undefined: {
      const res = await prismaClient.permission.findMany({
        where: {
          projectConfig: {
            projects: {
              some: {
                id: project.id,
              }
            }
          },
        },
        include: fullPermissionInclude,
      });
      results.push(...res.map(permissionDefinitionJsonFromDbType));
    }
  }

  if (scope === undefined || scope.type === "any-team" || scope.type === "specific-team") {
    for (const systemPermission of Object.values(DBTeamSystemPermission)) {
      results.push(permissionDefinitionJsonFromTeamSystemDbType(systemPermission));
    }
  }

  return results;
}

export async function listUserPermissionDefinitionsRecursive({
  project,
  teamId, 
  userId, 
  type,
}: {
  project: ProjectJson,
  teamId: string,
  userId: string, 
  type: 'team' | 'global',
}) {
  const allPermissions = [];
  if (type === 'team') {
    allPermissions.push(...await listPermissionDefinitions(project, { type: "specific-team", teamId }));
    allPermissions.push(...await listPermissionDefinitions(project, { type: "any-team" }));
  } else {
    allPermissions.push(...await listPermissionDefinitions(project, { type: "global" }));
  }
  const permissionsMap = new Map(allPermissions.map(p => [p.id, p]));

  const user = await prismaClient.teamMember.findUnique({
    where: {
      projectId_projectUserId_teamId: {
        projectId: project.id,
        projectUserId: userId,
        teamId,
      },
    },
    include: {
      directPermissions: {
        include: {
          permission: true,
        }
      }
    },
  });  

  if (!user) throw new KnownErrors.UserNotFound();
  
  const result = new Map<string, ReturnType<typeof permissionDefinitionJsonFromDbType>>();
  const idsToProcess = [...user.directPermissions.map(p => 
    p.permission?.queryableId || 
    (p.systemPermission ? teamDBTypeToSystemPermissionString(p.systemPermission) : null) ||
    throwErr(new StackAssertionError(`Permission should have either queryableId or systemPermission`, { p }))
  )];
  while (idsToProcess.length > 0) {
    const currentId = idsToProcess.pop()!;
    const current = permissionsMap.get(currentId);
    if (!current) throw new StackAssertionError(`Couldn't find permission in DB`, { currentId, result, idsToProcess });
    if (result.has(current.id)) continue;
    result.set(current.id, current);
    idsToProcess.push(...current.contained_permission_ids);
  }
  return [...result.values()];
}

export async function listUserDirectPermissionDefinitions({
  projectId, 
  teamId, 
  userId, 
  type,
}: {
  projectId: string, 
  teamId: string,
  userId: string, 
  type: 'team' | 'global',
}) {
  const user = await prismaClient.teamMember.findUnique({
    where: {
      projectId_projectUserId_teamId: {
        projectId,
        projectUserId: userId,
        teamId,
      },
    },
    include: {
      directPermissions: {
        include: {
          permission: {
            include: fullPermissionInclude,
          }
        }
      }
    },
  });
  if (!user) throw new KnownErrors.UserNotFound();
  return user.directPermissions.map(
    p => {
      if (p.permission) {
        return permissionDefinitionJsonFromDbType(p.permission);
      } else if (p.systemPermission) {
        return permissionDefinitionJsonFromTeamSystemDbType(p.systemPermission);
      } else {
        throw new StackAssertionError(`Permission should have either permission or systemPermission`, { p });
      }
    }
  ).filter(
    p => {
      switch (p.scope.type) {
        case "global": {
          return type === "global";
        }
        case "any-team":
        case "specific-team": {
          return type === "team";
        }
      }
    }
  );
}

export async function listPotentialParentPermissions(project: ProjectJson, scope: PermissionDefinitionScopeJson) {
  if (scope.type === "global") {
    return await listPermissionDefinitions(project, { type: "global" });
  } else {
    const scopes: PermissionDefinitionScopeJson[] = [
      { type: "any-team" },
      ...scope.type === "any-team" ? [] : [
        { type: "specific-team", teamId: scope.teamId } as const,
      ],
    ];

    return await Promise.all(scopes.map(s => listPermissionDefinitions(project, s))).then(res => res.flat(1));
  }
}

export async function createPermissionDefinition(
  project: ProjectJson,
  scope: PermissionDefinitionScopeJson, 
  permission: {
    id: string,
    description?: string,
    contained_permission_ids?: string[],
  }
) {
  const parentDbIds = await getParentDbIds(project, permission.contained_permission_ids);
  const dbPermission = await prismaClient.permission.create({
    data: {
      scope: scope.type === "global" ? "GLOBAL" : "TEAM",
      queryableId: permission.id,
      description: permission.description,
      ...scope.type === "specific-team" ? {
        projectId: project.id,
        teamId: scope.teamId,
      } : {
        projectConfigId: project.evaluatedConfig.id,
      },
      parentEdges: {
        create: parentDbIds.map(parentDbId => {
          if (isTeamSystemPermission(parentDbId)) {
            return {
              parentTeamSystemPermission: teamSystemPermissionStringToDBType(parentDbId),
            };
          } else {
            return {
              parentPermission: {
                connect: {
                  dbId: parentDbId,
                },
              },
            };
          }
        })
      },
    },
    include: fullPermissionInclude,
  });
  return permissionDefinitionJsonFromDbType(dbPermission);
}

export async function updatePermissionDefinitions(
  project: ProjectJson,
  scope: PermissionDefinitionScopeJson,
  permissionId: string, 
  permission: {
    id?: string,
    description?: string,
    contained_permission_ids?: string[],
  }
) {
  const parentDbIds = await getParentDbIds(project, permission.contained_permission_ids);

  let edgeUpdateData = {};
  if (permission.contained_permission_ids) {
    edgeUpdateData = {
      parentEdges: {
        deleteMany: {},
        create: parentDbIds.map(parentDbId => {
          if (isTeamSystemPermission(parentDbId)) {
            return {
              parentTeamSystemPermission: teamSystemPermissionStringToDBType(parentDbId),
            };
          } else {
            return {
              parentPermission: {
                connect: {
                  dbId: parentDbId,
                },
              },
            };
          }
        }),
      },
    };
  }

  const db = await prismaClient.permission.update({
    where: {
      projectConfigId_queryableId: {
        projectConfigId: project.evaluatedConfig.id,
        queryableId: permissionId,
      },
      scope: scope.type === "global" ? "GLOBAL" : "TEAM",
      teamId: scope.type === "specific-team" ? scope.teamId : undefined,
    },
    data: {
      queryableId: permission.id,
      description: permission.description,
      ...edgeUpdateData,
    },
    include: fullPermissionInclude,
  });
  return permissionDefinitionJsonFromDbType(db);
}

export async function deletePermissionDefinition(
  project: ProjectJson, 
  scope: PermissionDefinitionScopeJson, 
  permissionId: string
) {
  switch (scope.type) {
    case "global":
    case "any-team": {
      const deleted = await prismaClient.permission.deleteMany({
        where: {
          projectConfigId: project.evaluatedConfig.id,
          queryableId: permissionId,
          scope: scope.type === "global" ? "GLOBAL" : "TEAM",
        },
      });
      if (deleted.count < 1) throw new KnownErrors.PermissionNotFound(permissionId);
      break;
    }
    case "specific-team": {
      const team = await prismaClient.team.findUnique({
        where: {
          projectId_teamId: {
            projectId: project.id,
            teamId: scope.teamId,
          },
        },
      });
      if (!team) throw new KnownErrors.TeamNotFound(scope.teamId);
      const deleted = await prismaClient.permission.deleteMany({
        where: {
          projectId: project.id,
          queryableId: permissionId,
          teamId: scope.teamId,
          scope: "TEAM",
        },
      });
      if (deleted.count < 1) throw new KnownErrors.PermissionNotFound(permissionId);
      break;
    }
  }
}
