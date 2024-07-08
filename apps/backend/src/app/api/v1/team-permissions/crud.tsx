import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamPermissionsCrud } from '@stackframe/stack-shared/dist/interface/crud/team-permissions';
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";

export const teamPermissionsCrudHandlers = createCrudHandlers(teamPermissionsCrud, {
  querySchema: yupObject({
    team_id: yupString().optional(),
    user_id: yupString().optional(),
    perm_id: yupString().optional(),
    direct: yupString().oneOf(['true', 'false']).optional(),
  }),
  paramsSchema: yupObject({
    teamId: yupString().required(),
    userId: yupString().required(),
    permId: yupString().required(),
  }),
  async onCreate({ auth, params }) {
    if (isTeamSystemPermission(params.permId)) {
      const result = await prismaClient.teamMemberDirectPermission.upsert({
        where: {
          projectId_projectUserId_teamId_systemPermission: {
            projectId: auth.project.id,
            projectUserId: params.userId,
            teamId: params.teamId,
            systemPermission: teamSystemPermissionStringToDBType(params.permId),
          },
        },
        create: {
          systemPermission: teamSystemPermissionStringToDBType(params.permId),
          teamMember: {
            connect: {
              projectId_projectUserId_teamId: {
                projectId: auth.project.id,
                projectUserId: params.userId,
                teamId: params.teamId,
              },
            },
          },
        },
        update: {},
      });
      return {
        __database_id: result.id,
        id: params.permId,
      };
    } else {

      const teamSpecificPermission = await prismaClient.permission.findUnique({
        where: {
          projectId_teamId_queryableId: {
            projectId: auth.project.id,
            teamId: params.teamId,
            queryableId: params.permId,
          },
        }
      });
      const anyTeamPermission = await prismaClient.permission.findUnique({
        where: {
          projectConfigId_queryableId: {
            projectConfigId: auth.project.evaluatedConfig.id,
            queryableId: params.permId,
          },
        }
      });
    
      const permission = teamSpecificPermission || anyTeamPermission;
      if (!permission) throw new KnownErrors.PermissionNotFound(params.permId);

      const result = await prismaClient.teamMemberDirectPermission.upsert({
        where: {
          projectId_projectUserId_teamId_permissionDbId: {
            projectId: auth.project.id,
            projectUserId: params.userId,
            teamId: params.teamId,
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
                projectId: auth.project.id,
                projectUserId: params.userId,
                teamId: params.teamId,
              },
            },
          },
        },
        update: {},
      });

      return {
        __database_id: result.id,
        id: params.permId,
      };
    }
  },
  async onDelete({ auth, params }) {
    if (isTeamSystemPermission(params.permId)) {
      await prismaClient.teamMemberDirectPermission.delete({
        where: {
          projectId_projectUserId_teamId_systemPermission: {
            projectId: auth.project.id,
            projectUserId: params.userId,
            teamId: params.teamId,
            systemPermission: teamSystemPermissionStringToDBType(params.permId),
          },
        },
      });

      return;
    } else {
      const teamSpecificPermission = await prismaClient.permission.findUnique({
        where: {
          projectId_teamId_queryableId: {
            projectId: auth.project.id,
            teamId: params.teamId,
            queryableId: params.permId,
          },
        }
      });
      const anyTeamPermission = await prismaClient.permission.findUnique({
        where: {
          projectConfigId_queryableId: {
            projectConfigId: auth.project.evaluatedConfig.id,
            queryableId: params.permId,
          },
        }
      });
    
      const permission = teamSpecificPermission || anyTeamPermission;
      if (!permission) throw new KnownErrors.PermissionNotFound(params.permId);

      await prismaClient.teamMemberDirectPermission.delete({
        where: {
          projectId_projectUserId_teamId_permissionDbId: {
            projectId: auth.project.id,
            projectUserId: params.userId,
            teamId: params.teamId,
            permissionDbId: permission.dbId,
          }
        },
      });

      return;
    }
  },
  async onList({ auth, query }) {
    let userId = query.user_id;
    if (userId === 'me') {
      if (!auth.user) {
        throw new StatusError(StatusError.BadRequest, 'User authentication required to list permissions for user_id=me');
      }
      userId = auth.user.id;
    }
    if (auth.type === 'client') {
      if (!userId || userId !== auth.user?.id) {
        throw new StatusError(StatusError.BadRequest, 'Client can only list permissions for their own user. user_id must be either "me" or the ID of the current user');
      }
    }

    const results = await prismaClient.teamMemberDirectPermission.findMany({
      where: {
        projectId: auth.project.id,
        projectUserId: userId,
        teamId: query.team_id,
      },
      include: {
        permission: true,
      }
    });

    return {
      items: results.map(result => ({
        __database_id: result.id,
        id: result.systemPermission ? 
          result.systemPermission : 
          (result.permission ?? throwErr('Permission not found')).queryableId,
      })),
      is_paginated: false,
    };
  },
});
