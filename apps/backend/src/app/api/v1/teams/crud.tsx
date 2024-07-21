import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { sendWebhooks } from "@/lib/webhooks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";


export function teamPrismaToCrud(prisma: Prisma.TeamGetPayload<{}>) {
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
      const db = await tx.team.create({
        data: {
          displayName: data.display_name,
          projectId: auth.project.id,
        },
      });

      if (query.add_current_user === 'true') {
        if (!auth.user) {
          throw new StatusError(StatusError.Unauthorized, "You must be logged in to create a team with the current user as a member.");
        }
        await tx.teamMember.create({
          data: {
            projectId: auth.project.id,
            projectUserId: auth.user.id,
            teamId: db.teamId,
            directPermissions: {
              create: auth.project.config.team_creator_default_permissions.map((p) => {
                if (isTeamSystemPermission(p.id)) {
                  return {
                    systemPermission: teamSystemPermissionStringToDBType(p.id),
                  };
                } else {
                  return {
                    permission: {
                      connect: {
                        projectConfigId_queryableId: {
                          projectConfigId: auth.project.config.id,
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

    await sendWebhooks({
      type: "team.created",
      projectId: auth.project.id,
      data: {
        team_id: db.teamId,
        display_name: db.displayName,
        by_user_id: auth.user?.id,
      },
    });

    return teamPrismaToCrud(db);
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

    return teamPrismaToCrud(db);
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

    return teamPrismaToCrud(db);
  },
  onDelete: async ({ params, auth }) => {
    await prismaClient.team.delete({
      where: {
        projectId_teamId: {
          projectId: auth.project.id,
          teamId: params.team_id,
        },
      },
    });

    await sendWebhooks({
      type: "team.deleted",
      projectId: auth.project.id,
      data: {
        team_id: params.team_id,
      },
    });
  },
  onList: async ({ query, auth }) => {
    if (auth.type === 'client') {
      if (query.user_id !== 'me' && query.user_id !== auth.user?.id) {
        throw new StatusError(StatusError.Forbidden, "You are only allowed to access your own teams with the client access token.");
      }
    }

    if (query.user_id === 'me' && !auth.user) {
      throw new KnownErrors.CannotGetOwnUserWithoutUser();
    }

    let userId = query.user_id === 'me' ? auth.user?.id : query.user_id;

    const db = await prismaClient.team.findMany({
      where: {
        projectId: auth.project.id,
        ...userId ? {
          teamMembers: {
            some: {
              projectUserId: userId,
            },
          },
        } : {},
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      items: db.map(teamPrismaToCrud),
      is_paginated: false,
    };
  }
});
