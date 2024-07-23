import { ensureTeamMembershipExist } from "@/lib/db-checks";
import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { sendWebhooks } from "@/lib/webhooks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";


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
    user_id: userIdOrMeSchema.optional().meta({ openapiField: { onlyShowInOperations: ['List'], description: 'Filter for the teams that the user is a member of. Can be either `me` or an ID. Must be `me` in the client API', exampleValue: 'me' } }),
    add_current_user: yupString().oneOf(["true", "false"]).optional().meta({ openapiField: { onlyShowInOperations: ['Create'], description: "If to add the current user to the team. If this is not `true`, the newly created team will have no members. Notice that if you didn't specify `add_current_user=true` on the client side, the user cannot join the team again without re-adding them on the server side.", exampleValue: 'true' } }),
  }),
  paramsSchema: yupObject({
    team_id: yupString().uuid().required(),
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
    const db = await prismaClient.$transaction(async (tx) => {
      if (auth.type === 'client') {
        await ensureTeamMembershipExist(tx, {
          projectId: auth.project.id,
          teamId: params.team_id,
          userId: auth.user?.id ?? throwErr("Client must be logged in to read a team"),
        });
      }

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

      return db;
    });

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
    const userId = getIdFromUserIdOrMe(query.user_id, auth.user);
    if (auth.type === 'client' && userId !== auth.user?.id) {
      throw new StatusError(StatusError.Forbidden, 'Client can only list teams for their own user. user_id must be either "me" or the ID of the current user');
    }

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
