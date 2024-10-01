import { ensureTeamExist, ensureTeamMembershipExists, ensureUserTeamPermissionExists } from "@/lib/request-checks";
import { sendTeamCreatedWebhook, sendTeamDeletedWebhook, sendTeamUpdatedWebhook } from "@/lib/webhooks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { validateBase64Image } from "@stackframe/stack-shared/dist/utils/base64";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { addUserToTeam } from "../team-memberships/crud";


export function teamPrismaToCrud(prisma: Prisma.TeamGetPayload<{}>) {
  return {
    id: prisma.teamId,
    display_name: prisma.displayName,
    profile_image_url: prisma.profileImageUrl,
    created_at_millis: prisma.createdAt.getTime(),
    client_metadata: prisma.clientMetadata,
    client_read_only_metadata: prisma.clientReadOnlyMetadata,
    server_metadata: prisma.serverMetadata,
  };
}

export const teamsCrudHandlers = createLazyProxy(() => createCrudHandlers(teamsCrud, {
  querySchema: yupObject({
    user_id: userIdOrMeSchema.optional().meta({ openapiField: { onlyShowInOperations: ['List'], description: 'Filter for the teams that the user is a member of. Can be either `me` or an ID. Must be `me` in the client API', exampleValue: 'me' } }),
    /* deprecated, use creator_user_id in the body instead */
    add_current_user: yupString().oneOf(["true", "false"]).optional().meta({ openapiField: { onlyShowInOperations: ['Create'], hidden: true } }),
  }),
  paramsSchema: yupObject({
    team_id: yupString().uuid().required(),
  }),
  onCreate: async ({ query, auth, data }) => {
    if (data.creator_user_id && query.add_current_user) {
      throw new StatusError(StatusError.BadRequest, "Cannot use both creator_user_id and add_current_user. add_current_user is deprecated, please only use creator_user_id in the body.");
    }

    if (auth.type === 'client' && !auth.user) {
      throw new KnownErrors.UserAuthenticationRequired();
    }

    if (auth.type === 'client' && !auth.project.config.client_team_creation_enabled) {
      throw new StatusError(StatusError.Forbidden, 'Client team creation is disabled for this project');
    }

    if (auth.type === 'client' && data.profile_image_url && !validateBase64Image(data.profile_image_url)) {
      throw new StatusError(400, "Invalid profile image URL");
    }

    const db = await prismaClient.$transaction(async (tx) => {
      const db = await tx.team.create({
        data: {
          displayName: data.display_name,
          projectId: auth.project.id,
          profileImageUrl: data.profile_image_url,
          clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
          clientReadOnlyMetadata: data.client_read_only_metadata === null ? Prisma.JsonNull : data.client_read_only_metadata,
          serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
        },
      });

      let addUserId: string | undefined;
      if (data.creator_user_id) {
        if (auth.type === 'client') {
          const currentUserId = auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
          if (data.creator_user_id !== currentUserId) {
            throw new StatusError(StatusError.Forbidden, "You cannot add a user to the team as the creator that is not yourself on the client.");
          }
        }
        addUserId = data.creator_user_id;
      } else if (query.add_current_user === 'true') {
        if (!auth.user) {
          throw new StatusError(StatusError.Unauthorized, "You must be logged in to create a team with the current user as a member.");
        }
        addUserId = auth.user.id;
      }

      if (addUserId) {
        await addUserToTeam(tx, {
          project: auth.project,
          teamId: db.teamId,
          userId: addUserId,
          type: 'creator',
        });
      }

      return db;
    });

    const result = teamPrismaToCrud(db);

    await sendTeamCreatedWebhook({
      projectId: auth.project.id,
      data: result,
    });

    return result;
  },
  onRead: async ({ params, auth }) => {
    const db = await prismaClient.$transaction(async (tx) => {
      if (auth.type === 'client') {
        await ensureTeamMembershipExists(tx, {
          projectId: auth.project.id,
          teamId: params.team_id,
          userId: auth.user?.id ?? throwErr(new KnownErrors.UserAuthenticationRequired()),
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
    const db = await prismaClient.$transaction(async (tx) => {
      if (auth.type === 'client' && data.profile_image_url && !validateBase64Image(data.profile_image_url)) {
        throw new StatusError(400, "Invalid profile image URL");
      }

      if (auth.type === 'client') {
        await ensureUserTeamPermissionExists(tx, {
          project: auth.project,
          teamId: params.team_id,
          userId: auth.user?.id ?? throwErr(new KnownErrors.UserAuthenticationRequired()),
          permissionId: "$update_team",
          errorType: 'required',
          recursive: true,
        });
      }

      await ensureTeamExist(tx, { projectId: auth.project.id, teamId: params.team_id });

      return await tx.team.update({
        where: {
          projectId_teamId: {
            projectId: auth.project.id,
            teamId: params.team_id,
          },
        },
        data: {
          displayName: data.display_name,
          profileImageUrl: data.profile_image_url,
          clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
          clientReadOnlyMetadata: data.client_read_only_metadata === null ? Prisma.JsonNull : data.client_read_only_metadata,
          serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
        },
      });
    });

    const result = teamPrismaToCrud(db);

    await sendTeamUpdatedWebhook({
      projectId: auth.project.id,
      data: result,
    });

    return result;
  },
  onDelete: async ({ params, auth }) => {
    await prismaClient.$transaction(async (tx) => {
      if (auth.type === 'client') {
        await ensureUserTeamPermissionExists(tx, {
          project: auth.project,
          teamId: params.team_id,
          userId: auth.user?.id ?? throwErr(new KnownErrors.UserAuthenticationRequired()),
          permissionId: "$delete_team",
          errorType: 'required',
          recursive: true,
        });
      }
      await ensureTeamExist(tx, { projectId: auth.project.id, teamId: params.team_id });

      await tx.team.delete({
        where: {
          projectId_teamId: {
            projectId: auth.project.id,
            teamId: params.team_id,
          },
        },
      });
    });

    await sendTeamDeletedWebhook({
      projectId: auth.project.id,
      data: {
        id: params.team_id,
      },
    });
  },
  onList: async ({ query, auth }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());

      if (query.user_id !== currentUserId) {
        throw new StatusError(StatusError.Forbidden, 'Client can only list teams for their own user. user_id must be either "me" or the ID of the current user');
      }
    }

    const db = await prismaClient.team.findMany({
      where: {
        projectId: auth.project.id,
        ...query.user_id ? {
          teamMembers: {
            some: {
              projectUserId: query.user_id,
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
}));
