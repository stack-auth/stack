import { ensureTeamExist, ensureTeamMembershipExist, ensureUserExist, ensureUserHasTeamPermission } from "@/lib/request-checks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamMemberProfilesCrud } from "@stackframe/stack-shared/dist/interface/crud/team-member-profiles";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";

const fullInclude = { projectUser: true };

function prismaToCrud(prisma: Prisma.TeamMemberGetPayload<{ include: typeof fullInclude }>) {
  return {
    team_id: prisma.teamId,
    user_id: prisma.projectUserId,
    display_name: prisma.displayName ?? prisma.projectUser.displayName,
    profile_image_url: prisma.profileImageUrl ?? prisma.projectUser.profileImageUrl,
  };
}

export const teamMemberProfilesCrudHandlers = createLazyProxy(() => createCrudHandlers(teamMemberProfilesCrud, {
  querySchema: yupObject({
    user_id: userIdOrMeSchema.optional().meta({ openapiField: { onlyShowInOperations: ['List'] }}),
    team_id: yupString().uuid().optional().meta({ openapiField: { onlyShowInOperations: ['List'] }}),
  }),
  paramsSchema: yupObject({
    team_id: yupString().uuid().required(),
    user_id: userIdOrMeSchema.required(),
  }),
  onList: async ({ auth, query }) => {
    return await prismaClient.$transaction(async (tx) => {
      const userId = getIdFromUserIdOrMe(query.user_id, auth.user);
      if (auth.type === 'client') {
        // Client can only:
        // - list users in their own team if they have the $read_members permission
        // - list their own profile

        const currentUserId = auth.user?.id ?? throwErr("Client must be authenticated");

        if (!query.team_id) {
          throw new StatusError(StatusError.BadRequest, 'team_id is required for access type client');
        }

        await ensureTeamMembershipExist(tx, { projectId: auth.project.id, teamId: query.team_id, userId: currentUserId });

        if (userId !== currentUserId) {
          await ensureUserHasTeamPermission(tx, {
            project: auth.project,
            teamId: query.team_id,
            userId: currentUserId,
            permissionId: '$read_members',
          });
        }
      } else {
        if (query.team_id) {
          await ensureTeamExist(tx, { projectId: auth.project.id, teamId: query.team_id });
        }
        if (userId) {
          await ensureUserExist(tx, { projectId: auth.project.id, userId: userId });
        }
      }

      const db = await tx.teamMember.findMany({
        where: {
          projectId: auth.project.id,
          teamId: query.team_id,
          projectUserId: userId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: fullInclude,
      });

      return {
        items: db.map(prismaToCrud),
        is_paginated: false,
      };
    });
  },
  onRead: async ({ auth, params }) => {
    return await prismaClient.$transaction(async (tx) => {
      const userId = getIdFromUserIdOrMe(params.user_id, auth.user);

      if (auth.type === 'client' && userId !== auth.user?.id) {
        await ensureUserHasTeamPermission(tx, {
          project: auth.project,
          teamId: params.team_id,
          userId: auth.user?.id ?? throwErr("Client must be authenticated"),
          permissionId: '$read_members',
        });
      }

      await ensureTeamMembershipExist(tx, { projectId: auth.project.id, teamId: params.team_id, userId: userId });

      const db = await tx.teamMember.findUnique({
        where: {
          projectId_projectUserId_teamId: {
            projectId: auth.project.id,
            projectUserId: userId,
            teamId: params.team_id,
          },
        },
        include: fullInclude,
      });

      if (!db) {
        // This should never happen because of the check above
        throw new KnownErrors.TeamMembershipNotFound(params.team_id, userId);
      }

      return prismaToCrud(db);
    });
  },
  onUpdate: async ({ auth, data, params }) => {
    return await prismaClient.$transaction(async (tx) => {
      const userId = getIdFromUserIdOrMe(params.user_id, auth.user);

      if (auth.type === 'client' && userId !== auth.user?.id) {
        throw new StatusError(StatusError.Forbidden, 'Cannot update another user\'s profile');
      }

      await ensureTeamMembershipExist(tx, {
        projectId: auth.project.id,
        teamId: params.team_id,
        userId: auth.user?.id ?? throwErr("Client must be authenticated"),
      });

      const db = await tx.teamMember.update({
        where: {
          projectId_projectUserId_teamId: {
            projectId: auth.project.id,
            projectUserId: userId,
            teamId: params.team_id,
          },
        },
        data: {
          displayName: data.display_name,
          profileImageUrl: data.profile_image_url,
        },
        include: fullInclude,
      });

      return prismaToCrud(db);
    });
  },
}));
