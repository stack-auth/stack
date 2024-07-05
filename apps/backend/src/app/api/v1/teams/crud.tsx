import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export const teamsCrudHandlers = createPrismaCrudHandlers(teamsCrud, "team", {
  paramsSchema: yupObject({
    teamId: yupString().required(),
  }),
  baseFields: async ({ params, auth }) => ({
    teamId: params.teamId,
    projectId: auth.project.id,
  }),
  where: async ({ auth }) => {
    return {
      projectId: auth.project.id,
    };
  },
  include: async () => ({
  }),
  notFoundToCrud: (context) => {
    throw new KnownErrors.TeamNotFound(context.params.teamId ?? "<null>");
  },
  crudToPrisma: async (crud, { auth, params, type }) => {
    return {
      displayName: crud.display_name,
    };
  },
  onCreate: async (prisma, { auth }) => {
    if (auth.user) {
      // add user as team member
    }
  },
  prismaToCrud: async (prisma, { auth }) => {
    return {
      id: prisma.teamId,
      display_name: prisma.displayName,
    };
  },
});
