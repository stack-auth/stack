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
    permission_id: yupString().optional(),
    recursive: yupString().oneOf(['true', 'false']).optional(),
  }),
  paramsSchema: yupObject({
    teamId: yupString().required(),
    userId: yupString().required(),
    permissionId: yupString().required(),
  }),
  async onCreate({ auth, params }) {
    if (isTeamSystemPermission(params.permissionId)) {
      const result = await prismaClient.teamMemberDirectPermission.upsert({
        where: {
          projectId_projectUserId_teamId_systemPermission: {
            projectId: auth.project.id,
            projectUserId: params.userId,
            teamId: params.teamId,
            systemPermission: teamSystemPermissionStringToDBType(params.permissionId),
          },
        },
        create: {
          systemPermission: teamSystemPermissionStringToDBType(params.permissionId),
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
        id: params.permissionId,
      };
    } else {
      const teamSpecificPermission = await prismaClient.permission.findUnique({
        where: {
          projectId_teamId_queryableId: {
            projectId: auth.project.id,
            teamId: params.teamId,
            queryableId: params.permissionId,
          },
        }
      });
      const anyTeamPermission = await prismaClient.permission.findUnique({
        where: {
          projectConfigId_queryableId: {
            projectConfigId: auth.project.evaluatedConfig.id,
            queryableId: params.permissionId,
          },
        }
      });
    
      const permission = teamSpecificPermission || anyTeamPermission;
      if (!permission) throw new KnownErrors.PermissionNotFound(params.permissionId);

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
        id: params.permissionId,
      };
    }
  },
  async onDelete({ auth, params }) {
    if (isTeamSystemPermission(params.permissionId)) {
      await prismaClient.teamMemberDirectPermission.delete({
        where: {
          projectId_projectUserId_teamId_systemPermission: {
            projectId: auth.project.id,
            projectUserId: params.userId,
            teamId: params.teamId,
            systemPermission: teamSystemPermissionStringToDBType(params.permissionId),
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
            queryableId: params.permissionId,
          },
        }
      });
      const anyTeamPermission = await prismaClient.permission.findUnique({
        where: {
          projectConfigId_queryableId: {
            projectConfigId: auth.project.evaluatedConfig.id,
            queryableId: params.permissionId,
          },
        }
      });
    
      const permission = teamSpecificPermission || anyTeamPermission;
      if (!permission) throw new KnownErrors.PermissionNotFound(params.permissionId);

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
    if (auth.type === 'client' && userId !== auth.user?.id) {
      throw new StatusError(StatusError.BadRequest, 'Client can only list permissions for their own user. user_id must be either "me" or the ID of the current user');
    }

    // TODO: support recursive permissions
    // TODO: support team permissions
    const results = await prismaClient.teamMemberDirectPermission.findMany({
      where: {
        projectId: auth.project.id,
        projectUserId: userId,
        teamId: query.team_id,
        permission: {
          queryableId: query.permission_id,
        },
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
