import { addUserToTeam, createServerTeam, getServerTeamFromDbType } from "@/lib/teams";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";
import { BooleanTrue, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { userIdOrMeRequestSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";

export const usersCrudHandlers = createLazyProxy(() => createPrismaCrudHandlers(usersCrud, "projectUser", {
  querySchema: yupObject({
    team_id: yupString().optional(),
  }),
  paramsSchema: yupObject({
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
  where: async ({ query }) => {
    if (query.team_id) {
      return {
        teamMembers: {
          some: {
            teamId: query.team_id,
          },
        },
      };
    }
    return {};
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
  orderBy: async () => ({
    createdAt: 'desc',
  }),
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
  notFoundToCrud: (context) => {
    throw new KnownErrors.UserNotFound();
  },
  crudToPrisma: async (crud, { auth }) => {
    const projectId = auth.project.id;
    return {
      displayName: crud.display_name === undefined ? undefined : (crud.display_name || null),
      clientMetadata: crud.client_metadata === null ? Prisma.JsonNull : crud.client_metadata,
      serverMetadata: crud.server_metadata === null ? Prisma.JsonNull : crud.server_metadata,
      projectId,
      primaryEmail: crud.primary_email,
      primaryEmailVerified: crud.primary_email_verified ?? (crud.primary_email !== undefined ? false : undefined),
      authWithEmail: crud.primary_email_auth_enabled,
      passwordHash: crud.password == null ? crud.password : await hashPassword(crud.password),
      profileImageUrl: crud.profile_image_url,
      projectUserOAuthAccounts: {
        create: crud.oauth_providers?.map((provider) => ({
          projectId,
          providerConfig: {
            connect: {
              projectConfigId_id: {
                projectConfigId: auth.project.evaluatedConfig.id,
                id: provider.provider_id,
                email: provider.email,
              }
            }
          },
          providerAccountId: provider.account_id,
        })),
      }
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
      oauth_providers: prisma.projectUserOAuthAccounts.map((a) => ({
        provider_id: a.oauthProviderConfigId,
        account_id: a.providerAccountId,
        email: a.email,
      })),
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
}));

export const currentUserCrudHandlers = createLazyProxy(() => createCrudHandlers(currentUserCrud, {
  paramsSchema: yupObject({} as const),
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
  async onDelete({ auth }) {
    return await usersCrudHandlers.adminDelete({
      project: auth.project,
      userId: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
    });
  },
}));
