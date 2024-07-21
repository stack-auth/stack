import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";

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
    user_id: userIdOrMeSchema.optional(),
    add_current_user: yupString().oneOf(["true", "false"]).optional(),
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

    return prismaToCrud(db);
  },
  onRead: async ({ params, auth }) => {
    const db = await prismaClient.$transaction(async (tx) => {
      if (auth.type === 'client') {
        const member = await tx.teamMember.findUnique({
          where: {
            projectId_projectUserId_teamId: {
              projectId: auth.project.id,
              projectUserId: auth.user?.id || throwErr("Client must be logged in"),
              teamId: params.team_id,
            },
          },
        });

        if (!member) {
          throw new KnownErrors.TeamNotFound(params.team_id);
        }
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
      items: db.map(prismaToCrud),
      is_paginated: false,
    };
  }
});
