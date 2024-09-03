import { TeamSystemPermission as DBTeamSystemPermission, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { TeamPermissionDefinitionsCrud, TeamPermissionsCrud } from "@stackframe/stack-shared/dist/interface/crud/team-permissions";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase, typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { PrismaTransaction } from "./types";

export const fullPermissionInclude = {
  parentEdges: {
    include: {
      parentPermission: true,
    },
  },
} as const satisfies Prisma.PermissionInclude;

export function isTeamSystemPermission(permission: string): permission is `$${Lowercase<DBTeamSystemPermission>}` {
  return permission.startsWith("$") && permission.slice(1).toUpperCase() in DBTeamSystemPermission;
}

export function teamSystemPermissionStringToDBType(permission: `$${Lowercase<DBTeamSystemPermission>}`): DBTeamSystemPermission {
  return typedToUppercase(permission.slice(1)) as DBTeamSystemPermission;
}

export function teamDBTypeToSystemPermissionString(permission: DBTeamSystemPermission): `$${Lowercase<DBTeamSystemPermission>}` {
  return ("$" + typedToLowercase(permission)) as `$${Lowercase<DBTeamSystemPermission>}`;
}

export type TeamSystemPermission = ReturnType<typeof teamDBTypeToSystemPermissionString>;

const descriptionMap: Record<DBTeamSystemPermission, string> = {
  UPDATE_TEAM: "Update the team information",
  DELETE_TEAM: "Delete the team",
  READ_MEMBERS: "Read and list the other members of the team",
  REMOVE_MEMBERS: "Remove other members from the team",
  INVITE_MEMBERS: "Invite other users to the team",
};

export function teamPermissionDefinitionJsonFromDbType(
  db: Prisma.PermissionGetPayload<{ include: typeof fullPermissionInclude }>,
): TeamPermissionDefinitionsCrud["Admin"]["Read"] & { __database_id: string } {
  if (!db.projectConfigId && !db.teamId)
    throw new StackAssertionError(`Permission DB object should have either projectConfigId or teamId`, { db });
  if (db.projectConfigId && db.teamId)
    throw new StackAssertionError(`Permission DB object should have either projectConfigId or teamId, not both`, { db });
  if (db.scope === "GLOBAL" && db.teamId)
    throw new StackAssertionError(`Permission DB object should not have teamId when scope is GLOBAL`, { db });

  return {
    __database_id: db.dbId,
    id: db.queryableId,
    description: db.description || undefined,
    contained_permission_ids: db.parentEdges
      .map((edge) => {
        if (edge.parentPermission) {
          return edge.parentPermission.queryableId;
        } else if (edge.parentTeamSystemPermission) {
          return "$" + typedToLowercase(edge.parentTeamSystemPermission);
        } else {
          throw new StackAssertionError(`Permission edge should have either parentPermission or parentSystemPermission`, { edge });
        }
      })
      .sort(),
  } as const;
}

export function teamPermissionDefinitionJsonFromTeamSystemDbType(
  db: DBTeamSystemPermission,
): TeamPermissionDefinitionsCrud["Admin"]["Read"] & { __database_id: string } {
  return {
    __database_id: "$" + typedToLowercase(db),
    id: "$" + typedToLowercase(db),
    description: descriptionMap[db],
    contained_permission_ids: [] as string[],
  } as const;
}

async function getParentDbIds(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"];
    containedPermissionIds?: string[];
  },
) {
  const parentDbIds = [];
  const potentialParentPermissions = await listTeamPermissionDefinitions(tx, options.project);
  for (const parentPermissionId of options.containedPermissionIds || []) {
    const parentPermission = potentialParentPermissions.find((p) => p.id === parentPermissionId);
    if (!parentPermission) {
      throw new KnownErrors.ContainedPermissionNotFound(parentPermissionId);
    }
    parentDbIds.push(parentPermission.__database_id);
  }

  return parentDbIds;
}

export async function listUserTeamPermissions(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"];
    teamId?: string;
    userId?: string;
    permissionId?: string;
    recursive?: boolean;
  },
): Promise<TeamPermissionsCrud["Admin"]["Read"][]> {
  const allPermissions = await listTeamPermissionDefinitions(tx, options.project);
  const permissionsMap = new Map(allPermissions.map((p) => [p.id, p]));
  const results = await tx.teamMemberDirectPermission.findMany({
    where: {
      projectId: options.project.id,
      projectUserId: options.userId,
      teamId: options.teamId,
      permission: options.permissionId && !isTeamSystemPermission(options.permissionId) ? { queryableId: options.permissionId } : undefined,
      systemPermission:
        options.permissionId && isTeamSystemPermission(options.permissionId)
          ? teamSystemPermissionStringToDBType(options.permissionId)
          : undefined,
    },
    include: {
      permission: true,
    },
  });

  const groupedResults = new Map<string, typeof results>();
  for (const result of results) {
    if (!groupedResults.has(result.projectUserId)) {
      groupedResults.set(result.projectUserId, []);
    }
    groupedResults.get(result.projectUserId)!.push(result);
  }

  const finalResults: { id: string; team_id: string; user_id: string }[] = [];
  for (const [userId, userResults] of groupedResults) {
    const idsToProcess = [
      ...userResults.map(
        (p) =>
          p.permission?.queryableId ||
          (p.systemPermission ? teamDBTypeToSystemPermissionString(p.systemPermission) : null) ||
          throwErr(new StackAssertionError(`Permission should have either queryableId or systemPermission`, { p })),
      ),
    ];

    const result = new Map<string, ReturnType<typeof teamPermissionDefinitionJsonFromDbType>>();
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
    finalResults.push(
      ...[...result.values()].map((p) => ({
        id: p.id,
        team_id: userResults[0].teamId,
        user_id: userId,
      })),
    );
  }

  return finalResults.sort((a, b) => {
    if (a.team_id !== b.team_id) return a.team_id.localeCompare(b.team_id);
    if (a.user_id !== b.user_id) return a.user_id.localeCompare(b.user_id);
    return a.id.localeCompare(b.id);
  });
}

export async function grantTeamPermission(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"];
    teamId: string;
    userId: string;
    permissionId: string;
  },
) {
  if (isTeamSystemPermission(options.permissionId)) {
    await tx.teamMemberDirectPermission.upsert({
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
    const teamSpecificPermission = await tx.permission.findUnique({
      where: {
        projectId_teamId_queryableId: {
          projectId: options.project.id,
          teamId: options.teamId,
          queryableId: options.permissionId,
        },
      },
    });
    const anyTeamPermission = await tx.permission.findUnique({
      where: {
        projectConfigId_queryableId: {
          projectConfigId: options.project.config.id,
          queryableId: options.permissionId,
        },
      },
    });

    const permission = teamSpecificPermission || anyTeamPermission;
    if (!permission) throw new KnownErrors.PermissionNotFound(options.permissionId);

    await tx.teamMemberDirectPermission.upsert({
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

export async function revokeTeamPermission(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"];
    teamId: string;
    userId: string;
    permissionId: string;
  },
) {
  if (isTeamSystemPermission(options.permissionId)) {
    await tx.teamMemberDirectPermission.delete({
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
    const teamSpecificPermission = await tx.permission.findUnique({
      where: {
        projectId_teamId_queryableId: {
          projectId: options.project.id,
          teamId: options.teamId,
          queryableId: options.permissionId,
        },
      },
    });
    const anyTeamPermission = await tx.permission.findUnique({
      where: {
        projectConfigId_queryableId: {
          projectConfigId: options.project.config.id,
          queryableId: options.permissionId,
        },
      },
    });

    const permission = teamSpecificPermission || anyTeamPermission;
    if (!permission) throw new KnownErrors.PermissionNotFound(options.permissionId);

    await tx.teamMemberDirectPermission.delete({
      where: {
        projectId_projectUserId_teamId_permissionDbId: {
          projectId: options.project.id,
          projectUserId: options.userId,
          teamId: options.teamId,
          permissionDbId: permission.dbId,
        },
      },
    });
  }
}

export async function listTeamPermissionDefinitions(
  tx: PrismaTransaction,
  project: ProjectsCrud["Admin"]["Read"],
): Promise<(TeamPermissionDefinitionsCrud["Admin"]["Read"] & { __database_id: string })[]> {
  const res = await tx.permission.findMany({
    where: {
      projectConfig: {
        projects: {
          some: {
            id: project.id,
          },
        },
      },
      scope: "TEAM",
    },
    orderBy: { queryableId: "asc" },
    include: fullPermissionInclude,
  });
  const nonSystemPermissions = res.map((db) => teamPermissionDefinitionJsonFromDbType(db));

  const systemPermissions = Object.values(DBTeamSystemPermission).map((db) => teamPermissionDefinitionJsonFromTeamSystemDbType(db));

  return [...nonSystemPermissions, ...systemPermissions];
}

export async function createTeamPermissionDefinition(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"];
    data: {
      id: string;
      description?: string;
      contained_permission_ids?: string[];
    };
  },
) {
  const parentDbIds = await getParentDbIds(tx, {
    project: options.project,
    containedPermissionIds: options.data.contained_permission_ids,
  });
  const dbPermission = await tx.permission.create({
    data: {
      scope: "TEAM",
      queryableId: options.data.id,
      description: options.data.description,
      projectConfigId: options.project.config.id,
      parentEdges: {
        create: parentDbIds.map((parentDbId) => {
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
    },
    include: fullPermissionInclude,
  });
  return teamPermissionDefinitionJsonFromDbType(dbPermission);
}

export async function updateTeamPermissionDefinitions(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"];
    permissionId: string;
    data: {
      id?: string;
      description?: string;
      contained_permission_ids?: string[];
    };
  },
) {
  const parentDbIds = await getParentDbIds(tx, {
    project: options.project,
    containedPermissionIds: options.data.contained_permission_ids,
  });

  let edgeUpdateData = {};
  if (options.data.contained_permission_ids) {
    edgeUpdateData = {
      parentEdges: {
        deleteMany: {},
        create: parentDbIds.map((parentDbId) => {
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

  const db = await tx.permission.update({
    where: {
      projectConfigId_queryableId: {
        projectConfigId: options.project.config.id,
        queryableId: options.permissionId,
      },
      scope: "TEAM",
    },
    data: {
      queryableId: options.data.id,
      description: options.data.description,
      ...edgeUpdateData,
    },
    include: fullPermissionInclude,
  });
  return teamPermissionDefinitionJsonFromDbType(db);
}

export async function deleteTeamPermissionDefinition(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"];
    permissionId: string;
  },
) {
  const deleted = await tx.permission.deleteMany({
    where: {
      projectConfigId: options.project.config.id,
      queryableId: options.permissionId,
      scope: "TEAM",
    },
  });
  if (deleted.count < 1) throw new KnownErrors.PermissionNotFound(options.permissionId);
}
