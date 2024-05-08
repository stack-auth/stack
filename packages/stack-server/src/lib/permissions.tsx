import { prismaClient } from "@/prisma-client";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { PermissionDefinitionJson, PermissionDefinitionScopeJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerPermissionDefinitionCustomizableJson, ServerPermissionDefinitionJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
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
    id: db.queryableId,
    scope: 
      db.scope === "GLOBAL" ? { type: "global" } :
        db.teamId ? { type: "specific-team", teamId: db.teamId } :
          db.projectConfigId ? { type: "any-team" } :
            throwErr(new StackAssertionError(`Unexpected permission scope`, { db })), 
    description: db.description || undefined,
    containPermissionIds: db.parentEdges.map((edge) => edge.parentPermission.queryableId),
  };
}

export async function listServerPermissionDefinitions(projectId: string, scope?: PermissionDefinitionScopeJson): Promise<ServerPermissionDefinitionJson[]> {
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

export async function grantTeamUserPermission({
  projectId,
  teamId,
  projectUserId,
  type,
  permissionId,
}: {
  projectId: string,
  teamId: string, 
  projectUserId: string, 
  type: "team" | "global",
  permissionId: string,
}) {
  const project = await prismaClient.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) throw new KnownErrors.ProjectNotFound();

  switch (type) {
    case "global": {
      await prismaClient.teamMemberDirectPermission.upsert({
        where: {
          projectId_projectUserId_teamId_permissionDbId: {
            projectId,
            projectUserId,
            teamId,
            permissionDbId: permissionId,
          },
        },
        create: {
          permission: {
            connect: {
              projectConfigId_queryableId: {
                projectConfigId: project.configId,
                queryableId: permissionId,
              },
            },
          },
          teamMember: {
            connect: {
              projectId_projectUserId_teamId: {
                projectId: projectId,
                projectUserId: projectUserId,
                teamId: teamId,
              },
            },
          },
        },
        update: {},
      });
      break;
    }
    case "team": {
      const teamSpecificPermission = await prismaClient.permission.findUnique({
        where: {
          projectId_teamId_queryableId: {
            projectId,
            teamId,
            queryableId: permissionId,
          },
        }
      });
      const anyTeamPermission = await prismaClient.permission.findUnique({
        where: {
          projectConfigId_queryableId: {
            projectConfigId: project.configId,
            queryableId: permissionId,
          },
        }
      });
      
      const permission = teamSpecificPermission || anyTeamPermission;
      if (!permission) throw new KnownErrors.PermissionNotFound(permissionId);

      await prismaClient.teamMemberDirectPermission.upsert({
        where: {
          projectId_projectUserId_teamId_permissionDbId: {
            projectId,
            projectUserId,
            teamId,
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
                projectId: projectId,
                projectUserId: projectUserId,
                teamId: teamId,
              },
            },
          },
        },
        update: {},
      });

      break;
    }
  }
}

export async function revokeTeamUserPermission({
  projectId,
  teamId,
  projectUserId,
  type,
  permissionId,
}: {
  projectId: string,
  teamId: string, 
  projectUserId: string, 
  type: "team" | "global",
  permissionId: string,
}) {
  const project = await prismaClient.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) throw new KnownErrors.ProjectNotFound();

  switch (type) {
    case "global": {
      await prismaClient.teamMemberDirectPermission.deleteMany({
        where: {
          permission: {
            projectConfigId: project.configId,
            queryableId: permissionId,
          },
          teamMember: {
            projectId,
            projectUserId,
            teamId,
          },
        },
      });
      break;
    }
    case "team": {
      const teamSpecificPermission = await prismaClient.permission.findUnique({
        where: {
          projectId_teamId_queryableId: {
            projectId,
            teamId,
            queryableId: permissionId,
          },
        }
      });
      const anyTeamPermission = await prismaClient.permission.findUnique({
        where: {
          projectConfigId_queryableId: {
            projectConfigId: project.configId,
            queryableId: permissionId,
          },
        }
      });
      
      const permission = teamSpecificPermission || anyTeamPermission;
      if (!permission) throw new KnownErrors.PermissionNotFound(permissionId);

      await prismaClient.teamMemberDirectPermission.deleteMany({
        where: {
          permissionDbId: permission.dbId,
          teamMember: {
            projectId,
            projectUserId,
            teamId,
          },
        },
      });

      break;
    }
  }
}

export async function listUserPermissionDefinitionsRecursive({
  projectId, 
  teamId, 
  userId, 
  type,
}: {
  projectId: string, 
  teamId: string,
  userId: string, 
  type: 'team' | 'global',
}): Promise<ServerPermissionDefinitionJson[]> {
  const allPermissions = [];
  if (type === 'team') {
    allPermissions.push(...await listServerPermissionDefinitions(projectId, { type: "specific-team", teamId }));
    allPermissions.push(...await listServerPermissionDefinitions(projectId, { type: "any-team" }));
  } else {
    allPermissions.push(...await listServerPermissionDefinitions(projectId, { type: "global" }));
  }
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
      directPermissions: {
        include: {
          permission: true,
        }
      }
    },
  });  

  if (!user) throw new KnownErrors.UserNotFound();
  
  const result = new Map<string, ServerPermissionDefinitionJson>();
  const idsToProcess = [...user.directPermissions.map(p => p.permission.queryableId)];
  while (idsToProcess.length > 0) {
    const currentId = idsToProcess.pop()!;
    const current = permissionsMap.get(currentId);
    if (!current) throw new StackAssertionError(`Couldn't find permission in DB?`, { currentId, result, idsToProcess });
    if (result.has(current.id)) continue;
    result.set(current.id, current);
    idsToProcess.push(...current.containPermissionIds);
  }
  return [...result.values()];
}

export async function listUserDirectPermissions({
  projectId, 
  teamId, 
  userId, 
  type,
}: {
  projectId: string, 
  teamId: string,
  userId: string, 
  type: 'team' | 'global',
}): Promise<ServerPermissionDefinitionJson[]> {
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
    p => serverPermissionDefinitionJsonFromDbType(p.permission)
  ).filter(
    p => {
      switch(p.scope.type) {
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
  return (await Promise.all(scopes.map(s => listServerPermissionDefinitions(projectId, s)))).flat(1);
}

export async function createPermissionDefinition(
  projectId: string, 
  scope: PermissionDefinitionScopeJson, 
  permission: ServerPermissionDefinitionCustomizableJson
): Promise<ServerPermissionDefinitionJson> {
  const project = await prismaClient.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!project) throw new KnownErrors.ProjectNotFound();

  let parentDbIds = [];
  const potentialParentPermissions = await listPotentialParentPermissions(projectId, scope);
  for (const parentPermissionId of permission.containPermissionIds) {
    const parentPermission = potentialParentPermissions.find(p => p.id === parentPermissionId);
    if (!parentPermission) throw new KnownErrors.PermissionNotFound(parentPermissionId);
    parentDbIds.push(parentPermission.__databaseUniqueId);
  }
  const dbPermission = await prismaClient.permission.create({
    data: {
      scope: scope.type === "global" ? "GLOBAL" : "TEAM",
      queryableId: permission.id,
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

export async function updatePermissionDefinitions(
  projectId: string, 
  scope: PermissionDefinitionScopeJson, 
  permissionId: string, 
  permission: Partial<ServerPermissionDefinitionCustomizableJson>
): Promise<ServerPermissionDefinitionJson> {
  const project = await prismaClient.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!project) throw new KnownErrors.ProjectNotFound();

  let parentDbIds: string[] = [];
  if (permission.containPermissionIds) {
    const potentialParentPermissions = await listPotentialParentPermissions(projectId, scope);
    for (const parentPermissionId of permission.containPermissionIds) {
      const parentPermission = potentialParentPermissions.find(p => p.id === parentPermissionId);
      if (!parentPermission) throw new KnownErrors.PermissionNotFound(parentPermissionId);
      parentDbIds.push(parentPermission.__databaseUniqueId);
    }
  }

  let edgeUpdateData = {};
  if (permission.containPermissionIds) {
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
      projectConfigId_queryableId: {
        projectConfigId: project.configId,
        queryableId: permissionId,
      },
    },
    data: {
      queryableId: permission.id,
      description: permission.description,
      ...edgeUpdateData,
    },
    include: fullPermissionInclude,
  });
  return serverPermissionDefinitionJsonFromDbType(dbPermission);
}

export async function deletePermissionDefinition(projectId: string, scope: PermissionDefinitionScopeJson, permissionId: string) {
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
          projectConfigId_queryableId: {
            projectConfigId: project.configId,
            queryableId: permissionId,
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
          projectId_teamId_queryableId: {
            projectId,
            queryableId: permissionId,
            teamId: scope.teamId,
          },
        },
      });
      if (!deleted) throw new KnownErrors.PermissionNotFound(permissionId);
      break;
    }
  }
}
