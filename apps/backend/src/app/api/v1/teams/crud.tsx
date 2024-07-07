import { prismaClient } from "@/prisma-client";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

export const teamsCrudHandlers = createPrismaCrudHandlers(teamsCrud, "team", {
  querySchema: yupObject({
    user_id: yupString().optional(),
  }),
  paramsSchema: yupObject({
    teamId: yupString().required(),
  }),
  onPrepare: async ({ params, query, auth }) => {
    if (auth.type === 'client') {
      if (query.user_id !== 'me' && query.user_id !== auth.user?.id) {
        throw new StatusError(StatusError.Forbidden, "You are only allowed to access your own teams with the client access token.");
      }
    }
  },
  baseFields: async ({ params, auth }) => ({
    teamId: params.teamId,
    projectId: auth.project.id,
  }),
  where: async ({ query, auth }) => {
    return {
      projectId: auth.project.id,
      ...query.user_id ? { 
        teamMembers: {
          some: {
            projectUserId: query.user_id === 'me' ? auth.user?.id : query.user_id,
          }
        }
      } : {},
    };
  },
  whereUnique: async ({ params, auth }) => {
    return {
      projectId_teamId: {
        projectId: auth.project.id,
        teamId: params.teamId,
      },
      ...auth.type === 'client' ? {
        AND: {
          teamMembers: {
            some: {
              projectUserId: auth.user?.id,
            }
          }
        }
      } : {}
    };
  },
  include: async () => ({
  }),
  notFoundToCrud: (context) => {
    throw new KnownErrors.TeamNotFound(context.params.teamId ?? "<null>");
  },
  crudToPrisma: async (crud) => {
    // TODO: check update permissions
    return {
      displayName: crud.display_name,
    };
  },
  onCreate: async (prisma, { auth }) => {
    if (auth.user) {
      await prismaClient.teamMember.create({
        data: {
          projectId: auth.project.id,
          projectUserId: auth.user.id,
          teamId: prisma.teamId,
        }
      });
      // TODO: add permissions
    }
  },
  prismaToCrud: async (prisma) => {
    return {
      id: prisma.teamId,
      display_name: prisma.displayName,
      created_at_millis: prisma.createdAt.getTime(),
    };
  },
});
