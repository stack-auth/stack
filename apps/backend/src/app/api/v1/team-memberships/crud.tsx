import { prismaClient } from "@/prisma-client";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamMembershipsCrud } from "@stackframe/stack-shared/dist/interface/crud/team-memberships";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";

export const teamMembershipsCrudHandlers = createPrismaCrudHandlers(teamMembershipsCrud, "teamMember", {
  paramsSchema: yupObject({
    teamId: yupString().required(),
    userId: yupString().required(),
  }),
  baseFields: async () => ({}),
  whereUnique: async ({ params, auth }) => {
    return {
      projectId_projectUserId_teamId: {
        projectId: auth.project.id,
        projectUserId: params.userId,
        teamId: params.teamId,
      },
    };
  },
  include: async () => ({
  }),
  notFoundToCrud: (context) => {
    throw new KnownErrors.TeamMembershipNotFound(context.params.teamId ?? "<null>", context.params.userId ?? "<null>");
  },
  crudToPrisma: async (crud, { auth, params, type }) => {
    if (type === 'update') {
      throw new StackAssertionError('Update is not implemented for this endpoint');
    }

    // TODO: add permissions to the member
    return {
      projectUserId: params.userId || throwErr('userId is required'),
      teamId: params.teamId || throwErr('teamId is required'),
      projectId: auth.project.id,
    };
  },
  prismaToCrud: async () => ({}),
});
