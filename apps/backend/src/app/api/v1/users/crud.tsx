import { getServerTeamFromDbType } from "@/lib/teams";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { userIdOrMeRequestSchema } from "@stackframe/stack-shared/dist/schema-fields";
import * as yup from "yup";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";

export const usersCrudHandlers = createPrismaCrudHandlers(usersCrud, "projectUser", {
  metadataMap: {
    read: {
      summary: 'Get user',
      description: 'Gets a user by user ID.',
      tags: ['Users'],
    },
    update: {
      summary: 'Update user',
      description: 'Updates a user. Only the values provided will be updated.',
      tags: ['Users'],
    },
    delete: {
      summary: 'Delete user',
      description: 'Deletes a user. Use this with caution.',
      tags: ['Users'],
    },
    list: {
      summary: 'List users',
      description: 'Lists all the users in the project.',
      tags: ['Users'],
    },
  },
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
    selectedTeam: true,
  }),
  createNotFoundError: () => new KnownErrors.UserNotFound(),
  crudToPrisma: async (crud, { auth }) => {
    const projectId = auth.project.id;
    return {
      displayName: crud.display_name,
      clientMetadata: crud.client_metadata === null ? Prisma.JsonNull : crud.client_metadata,
      serverMetadata: crud.server_metadata === null ? Prisma.JsonNull : crud.server_metadata,
      projectId,
      primaryEmail: crud.primary_email,
      primaryEmailVerified: crud.primary_email_verified ?? (crud.primary_email !== undefined ? false : undefined),
    };
  },
  prismaToCrud: async (prisma, { auth }) => {    
    return {
      project_id: prisma.projectId,
      id: prisma.projectUserId,
      display_name: prisma.displayName,
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
      selected_team_id: prisma.selectedTeamId,
      selected_team: prisma.selectedTeam && getServerTeamFromDbType(prisma.selectedTeam),
    };
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
  metadataMap: {
    read: {
      summary: 'Get current user',
      description: 'Gets the currently authenticated user.',
      tags: ['Users'],
    },
    update: {
      summary: 'Update current user',
      description: 'Updates the currently authenticated user. Only the values provided will be updated.',
      tags: ['Users'],
    },
    delete: {
      summary: 'Delete current user',
      description: 'Deletes the currently authenticated user. Use this with caution.',
      tags: ['Users'],
    },
  },
});
