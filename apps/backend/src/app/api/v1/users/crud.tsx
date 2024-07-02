import { addUserToTeam, createServerTeam, getServerTeamFromDbType } from "@/lib/teams";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { BooleanTrue, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { userIdOrMeRequestSchema } from "@stackframe/stack-shared/dist/schema-fields";
import * as yup from "yup";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";

export const usersCrudHandlers = createPrismaCrudHandlers(usersCrud, "projectUser", {
  paramsSchema: yup.object({
    userId: userIdOrMeRequestSchema.required(),
  }),
  baseFields: async ({ auth, params }) => {
    const projectId = auth.project.id;
    const userId = params.userId;
    return {
      projectId,
      projectUserId: userId,
    };
  },
  whereUnique: async ({ auth, params }) => {
    const projectId = auth.project.id;
    const userId = params.userId;
    return {
      projectId_projectUserId: {
        projectId,
        projectUserId: userId,
      },
    };
  },
  include: async () => ({
    projectUserOAuthAccounts: true,
    teamMembers: {
      include: {
        team: true,
      },
      where: {
        isSelected: BooleanTrue.TRUE,
      },
    },
  }),
  notFoundError: () => new KnownErrors.UserNotFound(),
  crudToPrisma: async (crud, { auth }) => {
    const projectId = auth.project.id;
    return {
      displayName: crud.display_name === undefined ? undefined : (crud.display_name || null),
      clientMetadata: crud.client_metadata === null ? Prisma.JsonNull : crud.client_metadata,
      serverMetadata: crud.server_metadata === null ? Prisma.JsonNull : crud.server_metadata,
      projectId,
      primaryEmail: crud.primary_email,
      primaryEmailVerified: crud.primary_email_verified ?? (crud.primary_email !== undefined ? false : undefined),
      authWithEmail: crud.auth_with_email,
    };
  },
  prismaToCrud: async (prisma, { auth }) => {
    const selectedTeamMembers = prisma.teamMembers;
    if (selectedTeamMembers.length > 1) {
      throw new StackAssertionError("User cannot have more than one selected team; this should never happen");
    }
    return {
      project_id: prisma.projectId,
      id: prisma.projectUserId,
      display_name: prisma.displayName || null,
      primary_email: prisma.primaryEmail,
      primary_email_verified: prisma.primaryEmailVerified,
      profile_image_url: prisma.profileImageUrl,
      signed_up_at_millis: prisma.createdAt.getTime(),
      client_metadata: prisma.clientMetadata,
      server_metadata: prisma.serverMetadata,
      auth_method: prisma.passwordHash ? 'credential' as const : 'oauth' as const, // not used anymore, for backwards compatibility
      has_password: !!prisma.passwordHash,
      auth_with_email: prisma.authWithEmail,
      oauth_providers: prisma.projectUserOAuthAccounts.map((a) => a.oauthProviderConfigId),
      selected_team_id: selectedTeamMembers[0]?.teamId ?? null,
      selected_team: selectedTeamMembers[0] ? getServerTeamFromDbType(selectedTeamMembers[0]?.team) : null,
    };
  },
  onCreate: async (prisma, context) => {
    // TODO use the same transaction as the one that creates the user row
  
    const project = context.auth.project;
    if (project.evaluatedConfig.createTeamOnSignUp) {
      const team = await createServerTeam(
        project.id,
        {
          displayName: `${prisma.displayName ?? prisma.primaryEmail ?? "Unnamed user"}'s personal team`,
        },
      );
      await addUserToTeam(project.id, team.id, prisma.projectUserId);
    }
  },
});

export const currentUserCrudHandlers = createCrudHandlers(currentUserCrud, {
  paramsSchema: yup.object({} as const),
  async onRead({ auth }) {
    return await usersCrudHandlers.adminRead({
      project: auth.project,
      userId: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
    });
  },
  async onUpdate({ auth, data }) {
    return await usersCrudHandlers.adminUpdate({
      project: auth.project,
      userId: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
      data,
    });
  },
  async onDelete({ auth, data }) {
    return await usersCrudHandlers.adminDelete({
      project: auth.project,
      userId: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
      data,
    });
  },
});
