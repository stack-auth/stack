import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

function prismaToCrud(prisma: Prisma.TeamGetPayload<{}>) {
  return {
    id: prisma.teamId,
    display_name: prisma.displayName,
    profile_image_url: prisma.profileImageUrl,
    created_at_millis: prisma.createdAt.getTime(),
  };
}

export const teamsCrudHandlers = createCrudHandlers(teamsCrud, {
  querySchema: yupObject({
    user_id: yupString().optional(),
    add_current_user: yupString().oneOf(["true", "false"]).optional(),
  }),
  paramsSchema: yupObject({
    team_id: yupString().required(),
  }),
  onCreate: async ({ query, auth, data }) => {
    const db = await prismaClient.$transaction(async (tx) => {
      const db = await prismaClient.team.create({
        data: {
          displayName: data.display_name,
          projectId: auth.project.id,
        },
      });

      if (query.add_current_user === 'true') {
        if (!auth.user) {
          throw new StatusError(StatusError.Unauthorized, "You must be logged in to create a team with the current user as a member.");
        }
        await prismaClient.teamMember.create({
          data: {
            projectId: auth.project.id,
            projectUserId: auth.user.id,
            teamId: db.teamId,
            directPermissions: {
              create: auth.project.evaluatedConfig.teamCreatorDefaultPermissions.map((p) => {
                if (isTeamSystemPermission(p.id)) {
                  return {
                    systemPermission: teamSystemPermissionStringToDBType(p.id),
                  };
                } else {
                  return {
                    permission: {
                      connect: {
                        projectConfigId_queryableId: {
                          projectConfigId: auth.project.evaluatedConfig.id,
                          queryableId: p.id,
                        },
                      }
                    }
                  };
                }
              }),
            },
          }
        });
      }

      return db;
    });

    return prismaToCrud(db);
  },
  onRead: async ({ params, auth }) => {
    const db = await prismaClient.team.findUnique({
      where: {
        projectId_teamId: {
          projectId: auth.project.id,
          teamId: params.team_id,
        },
      },
    });

    if (!db) {
      throw new KnownErrors.TeamNotFound(params.team_id);
    }

    return prismaToCrud(db);
  },
  onUpdate: async ({ params, auth, data }) => {
    const db = await prismaClient.team.update({
      where: {
        projectId_teamId: {
          projectId: auth.project.id,
          teamId: params.team_id,
        },
      },
      data: {
        displayName: data.display_name,
        profileImageUrl: data.profile_image_url,
      },
    });

    return prismaToCrud(db);
  },
  onDelete: async ({ params, auth }) => {
    const db = await prismaClient.team.delete({
      where: {
        projectId_teamId: {
          projectId: auth.project.id,
          teamId: params.team_id,
        },
      },
    });
  },
  onList: async ({ query, auth }) => {
    if (auth.type === 'client') {
      if (query.user_id !== 'me' && query.user_id !== auth.user?.id) {
        throw new StatusError(StatusError.Forbidden, "You are only allowed to access your own teams with the client access token.");
      }
    }
    const db = await prismaClient.team.findMany({
      where: {
        projectId: auth.project.id,
        ...query.user_id ? {
          teamMembers: {
            some: {
              projectUserId: query.user_id === 'me' ? auth.user?.id : query.user_id,
            },
          },
        } : {},
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      items: db.map(prismaToCrud),
      is_paginated: false,
    };
  }
});
