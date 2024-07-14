import { prismaClient } from "@/prisma-client";
import { TeamSystemPermission as DBTeamSystemPermission, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { PermissionDefinitionScopeJson, ProjectJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase, typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";

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

export function permissionDefinitionJsonFromDbType(db: Prisma.PermissionGetPayload<{ include: typeof fullPermissionInclude }>) {
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
    }).sort(),
    scope: (
      db.scope === "GLOBAL" ? { type: "global" } : 
        db.teamId ? { type: "specific-team", teamId: db.teamId } : 
          { type: "any-team" }
    ) as PermissionDefinitionScopeJson,
  } as const;
}

export function permissionDefinitionJsonFromTeamSystemDbType(db: DBTeamSystemPermission) {
  return {
    __database_id: '$' + typedToLowercase(db),
    id: '$' + typedToLowercase(db),
    scope: { type: "any-team" },
    description: descriptionMap[db],
    contained_permission_ids: [] as string[],
  } as const;
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


export async function listUserTeamPermissions(options: {
  project: ProjectJson,
  teamId?: string,
  userId?: string,
  permissionId?: string,
  recursive?: boolean,
}) {
  const allPermissions = await listPermissionDefinitions(options.project, { type: "any-team" });
  const permissionsMap = new Map(allPermissions.map(p => [p.id, p]));
  const results = await prismaClient.teamMemberDirectPermission.findMany({
    where: {
      projectId: options.project.id,
      projectUserId: options.userId,
      teamId: options.teamId,
      permission: options.permissionId ? {
        queryableId: options.permissionId,
      } : undefined
    },
    include: {
      permission: true,
    }
  });

  const groupedResults = new Map<string, typeof results>();
  for (const result of results) {
    if (!groupedResults.has(result.projectUserId)) {
      groupedResults.set(result.projectUserId, []);
    }
    groupedResults.get(result.projectUserId)!.push(result);
  }

  const finalResults: { id: string, team_id: string, user_id: string }[] = [];
  for (const [userId, userResults] of groupedResults) {
    const idsToProcess = [...userResults.map(p =>
      p.permission?.queryableId ||
      (p.systemPermission ? teamDBTypeToSystemPermissionString(p.systemPermission) : null) ||
      throwErr(new StackAssertionError(`Permission should have either queryableId or systemPermission`, { p }))
    )];

    const result = new Map<string, ReturnType<typeof permissionDefinitionJsonFromDbType>>();
    while (idsToProcess.length > 0) {
      const currentId = idsToProcess.pop()!;
      const current = permissionsMap.get(currentId);
      if (!current) throw new StackAssertionError(`Couldn't find permission in DB`, { currentId, result, idsToProcess });
      if (result.has(current.id)) continue;
      result.set(current.id, current);
      if (options.recursive) {
        idsToProcess.push(...current.contained_permission_ids);
      }
    }
    finalResults.push(...[...result.values()].map(p => ({
      id: p.id,
      team_id: userResults[0].teamId,
      user_id: userId,
    })));
  }
  
  return finalResults.sort((a, b) => {
    if (a.team_id !== b.team_id) return a.team_id.localeCompare(b.team_id);
    if (a.user_id !== b.user_id) return a.user_id.localeCompare(b.user_id);
    return a.id.localeCompare(b.id);
  });
}

export async function grantTeamPermission(options: {
  project: ProjectJson,
  teamId: string,
  userId: string,
  permissionId: string,
}) {
  if (isTeamSystemPermission(options.permissionId)) {
    await prismaClient.teamMemberDirectPermission.upsert({
      where: {
        projectId_projectUserId_teamId_systemPermission: {
          projectId: options.project.id,
          projectUserId: options.userId,
          teamId: options.teamId,
          systemPermission: teamSystemPermissionStringToDBType(options.permissionId),
        },
      },
      create: {
        systemPermission: teamSystemPermissionStringToDBType(options.permissionId),
        teamMember: {
          connect: {
            projectId_projectUserId_teamId: {
              projectId: options.project.id,
              projectUserId: options.userId,
              teamId: options.teamId,
            },
          },
        },
      },
      update: {},
    });
  } else {
    const teamSpecificPermission = await prismaClient.permission.findUnique({
      where: {
        projectId_teamId_queryableId: {
          projectId: options.project.id,
          teamId: options.teamId,
          queryableId: options.permissionId,
        },
      }
    });
    const anyTeamPermission = await prismaClient.permission.findUnique({
      where: {
        projectConfigId_queryableId: {
          projectConfigId: options.project.evaluatedConfig.id,
          queryableId: options.permissionId,
        },
      }
    });
  
    const permission = teamSpecificPermission || anyTeamPermission;
    if (!permission) throw new KnownErrors.PermissionNotFound(options.permissionId);

    const result = await prismaClient.teamMemberDirectPermission.upsert({
      where: {
        projectId_projectUserId_teamId_permissionDbId: {
          projectId: options.project.id,
          projectUserId: options.userId,
          teamId: options.teamId,
          permissionDbId: permission.dbId,
        },
      },
      create: {
        permission: {
          connect: {
            dbId: permission.dbId,
          },
        },
        teamMember: {
          connect: {
            projectId_projectUserId_teamId: {
              projectId: options.project.id,
              projectUserId: options.userId,
              teamId: options.teamId,
            },
          },
        },
      },
      update: {},
    });
  }

  return {
    id: options.permissionId,
    user_id: options.userId,
    team_id: options.teamId,
  };
}

export async function revokeTeamPermission(options: {
  project: ProjectJson,
  teamId: string,
  userId: string,
  permissionId: string,
}) {
  if (isTeamSystemPermission(options.permissionId)) {
    await prismaClient.teamMemberDirectPermission.delete({
      where: {
        projectId_projectUserId_teamId_systemPermission: {
          projectId: options.project.id,
          projectUserId: options.userId,
          teamId: options.teamId,
          systemPermission: teamSystemPermissionStringToDBType(options.permissionId),
        },
      },
    });

    return;
  } else {
    const teamSpecificPermission = await prismaClient.permission.findUnique({
      where: {
        projectId_teamId_queryableId: {
          projectId: options.project.id,
          teamId: options.teamId,
          queryableId: options.permissionId,
        },
      }
    });
    const anyTeamPermission = await prismaClient.permission.findUnique({
      where: {
        projectConfigId_queryableId: {
          projectConfigId: options.project.evaluatedConfig.id,
          queryableId: options.permissionId,
        },
      }
    });
  
    const permission = teamSpecificPermission || anyTeamPermission;
    if (!permission) throw new KnownErrors.PermissionNotFound(options.permissionId);

    await prismaClient.teamMemberDirectPermission.delete({
      where: {
        projectId_projectUserId_teamId_permissionDbId: {
          projectId: options.project.id,
          projectUserId: options.userId,
          teamId: options.teamId,
          permissionDbId: permission.dbId,
        }
      },
    });
  }
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
        orderBy: { queryableId: 'asc' },
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

export async function createPermissionDefinition(options: {
  project: ProjectJson,
  scope: PermissionDefinitionScopeJson, 
  data: {
    id: string,
    description?: string,
    contained_permission_ids?: string[],
  },
}) {
  const parentDbIds = await getParentDbIds(options.project, options.data.contained_permission_ids);
  const dbPermission = await prismaClient.permission.create({
    data: {
      scope: options.scope.type === "global" ? "GLOBAL" : "TEAM",
      queryableId: options.data.id,
      description: options.data.description,
      ...options.scope.type === "specific-team" ? {
        projectId: options.project.id,
        teamId: options.scope.teamId,
      } : {
        projectConfigId: options.project.evaluatedConfig.id,
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

export async function updatePermissionDefinitions(options: {
  project: ProjectJson,
  scope: PermissionDefinitionScopeJson,
  permissionId: string, 
  data: {
    id?: string,
    description?: string,
    contained_permission_ids?: string[],
  },
}) {
  const parentDbIds = await getParentDbIds(options.project, options.data.contained_permission_ids);

  let edgeUpdateData = {};
  if (options.data.contained_permission_ids) {
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
        projectConfigId: options.project.evaluatedConfig.id,
        queryableId: options.permissionId,
      },
      scope: options.scope.type === "global" ? "GLOBAL" : "TEAM",
      teamId: options.scope.type === "specific-team" ? options.scope.teamId : undefined,
    },
    data: {
      queryableId: options.data.id,
      description: options.data.description,
      ...edgeUpdateData,
    },
    include: fullPermissionInclude,
  });
  return permissionDefinitionJsonFromDbType(db);
}

export async function deletePermissionDefinition(options: {
  project: ProjectJson, 
  scope: PermissionDefinitionScopeJson, 
  permissionId: string,
}) {
  switch (options.scope.type) {
    case "global":
    case "any-team": {
      const deleted = await prismaClient.permission.deleteMany({
        where: {
          projectConfigId: options.project.evaluatedConfig.id,
          queryableId: options.permissionId,
          scope: options.scope.type === "global" ? "GLOBAL" : "TEAM",
        },
      });
      if (deleted.count < 1) throw new KnownErrors.PermissionNotFound(options.permissionId);
      break;
    }
    case "specific-team": {
      const team = await prismaClient.team.findUnique({
        where: {
          projectId_teamId: {
            projectId: options.project.id,
            teamId: options.scope.teamId,
          },
        },
      });
      if (!team) throw new KnownErrors.TeamNotFound(options.scope.teamId);
      const deleted = await prismaClient.permission.deleteMany({
        where: {
          projectId: options.project.id,
          queryableId: options.permissionId,
          teamId: options.scope.teamId,
          scope: "TEAM",
        },
      });
      if (deleted.count < 1) throw new KnownErrors.PermissionNotFound(options.permissionId);
      break;
    }
  }
}
