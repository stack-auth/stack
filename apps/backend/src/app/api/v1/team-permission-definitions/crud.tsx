import { isTeamSystemPermission, listPotentialParentPermissions, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { Prisma, TeamSystemPermission as DBTeamSystemPermission } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamPermissionDefinitionsCrud } from '@stackframe/stack-shared/dist/interface/crud/team-permissions';
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";

const descriptionMap: Record<DBTeamSystemPermission, string> = {
  "UPDATE_TEAM": "Update the team information",
  "DELETE_TEAM": "Delete the team",
  "READ_MEMBERS": "Read and list the other members of the team",
  "REMOVE_MEMBERS": "Remove other members from the team",
  "INVITE_MEMBERS": "Invite other users to the team",
};

const fullInclude = {
  parentEdges: {
    include: {
      parentPermission: true,
    },
  },
} as const satisfies Prisma.PermissionInclude;

function fromDbType(
  db: Prisma.PermissionGetPayload<{ include: typeof fullInclude }>
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
  };
}

function fromSystemDbType(
  db: DBTeamSystemPermission,
) {
  return {
    __database_id: '$' + typedToLowercase(db),
    id: '$' + typedToLowercase(db),
    scope: { type: "any-team" },
    description: descriptionMap[db],
    contained_permission_ids: [],
  };
}

async function getParentDbIds(projectId: string, containedPermissionIds: string[]) {
  let parentDbIds = [];
  const potentialParentPermissions = await listPotentialParentPermissions(projectId, { type: "any-team" });
  for (const parentPermissionId of containedPermissionIds) {
    const parentPermission = potentialParentPermissions.find(p => p.id === parentPermissionId);
    if (!parentPermission) {
      throw new KnownErrors.PermissionNotFound(parentPermissionId);
    }
    parentDbIds.push(parentPermission.__databaseUniqueId);
  }

  return parentDbIds;
}

export const teamPermissionDefinitionsCrudHandlers = createCrudHandlers(teamPermissionDefinitionsCrud, {
  querySchema: yupObject({
    direct: yupString().oneOf(['true', 'false']).optional(),
  }),
  paramsSchema: yupObject({
    permissionId: yupString().required(),
  }),
  async onCreate({ auth, data }) {
    const parentDbIds = await getParentDbIds(
      auth.project.evaluatedConfig.id, 
      data.contained_permission_ids || []
    );

    const db = await prismaClient.permission.create({
      data: {
        scope: "TEAM",
        queryableId: data.id,
        description: data.description,
        projectConfigId: auth.project.evaluatedConfig.id,
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
      include: fullInclude,
    });
    
    return fromDbType(db);
  },
  async onUpdate({ auth, data, params }) {
    const parentDbIds = await getParentDbIds(
      auth.project.evaluatedConfig.id, 
      data.contained_permission_ids || []
    );

    let edgeUpdateData = {};
    if (data.contained_permission_ids) {
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
          projectConfigId: auth.project.evaluatedConfig.id,
          queryableId: params.permissionId,
        },
      },
      data: {
        queryableId: data.id,
        description: data.description,
        ...edgeUpdateData,
      },
      include: fullInclude,
    });
    return fromDbType(db);
  },
  async onDelete({ auth, params }) {
    await prismaClient.permission.delete({
      where: {
        projectConfigId_queryableId: {
          projectConfigId: auth.project.evaluatedConfig.id,
          queryableId: params.permissionId,
        },
      },
    });
  },
  async onList({ auth }) {
    const results: ReturnType<typeof fromDbType>[] = [];
    const db = await prismaClient.permission.findMany({
      where: {
        projectConfig: {
          projects: {
            some: {
              id: auth.project.id,
            }
          }
        },
        scope: "TEAM",
      },
      include: fullInclude,
    });
    results.push(...db.map(fromDbType));

    for (const systemPermission of Object.values(DBTeamSystemPermission)) {
      results.push(fromSystemDbType(systemPermission));
    }

    return {
      items: results,
      is_paginated: false,
    };
  },
});
