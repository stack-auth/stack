import { getServerTeamFromDbType } from "@/lib/teams";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";

export const usersCrudHandlers = createPrismaCrudHandlers(usersCrud, "projectUser", {
  metadataMap: {
    read: {
      summary: 'Get a user',
      description: 'Get a user by user ID',
      tags: ['Users'],
    },
    update: {
      summary: 'Update a user',
      description: 'Update a user. Only the values provided will be updated',
      tags: ['Users'],
    },
    delete: {
      summary: 'Delete a user',
      description: 'Delete a user. Use this with caution',
      tags: ['Users'],
    },
    list: {
      summary: 'List users',
      description: 'List all the users in the project',
      tags: ['Users'],
    },
  },
  paramNames: ["userId"],
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
      displayName: crud.displayName,
      clientMetadata: crud.clientMetadata === null ? Prisma.JsonNull : crud.clientMetadata,
      serverMetadata: crud.serverMetadata === null ? Prisma.JsonNull : crud.serverMetadata,
      projectId,
      primaryEmail: crud.primaryEmail,
      primaryEmailVerified: crud.primaryEmailVerified ?? (crud.primaryEmail !== undefined ? false : undefined),
    };
  },
  prismaToCrud: async (prisma, { auth }) => {    
    return {
      projectId: prisma.projectId,
      id: prisma.projectUserId,
      displayName: prisma.displayName,
      primaryEmail: prisma.primaryEmail,
      primaryEmailVerified: prisma.primaryEmailVerified,
      profileImageUrl: prisma.profileImageUrl,
      signedUpAtMillis: prisma.createdAt.getTime(),
      clientMetadata: prisma.clientMetadata,
      serverMetadata: prisma.serverMetadata,
      authMethod: prisma.passwordHash ? 'credential' as const : 'oauth' as const, // not used anymore, for backwards compatibility
      hasPassword: !!prisma.passwordHash,
      authWithEmail: prisma.authWithEmail,
      oauthProviders: prisma.projectUserOAuthAccounts.map((a) => a.oauthProviderConfigId),
      selectedTeamId: prisma.selectedTeamId,
      selectedTeam: prisma.selectedTeam && getServerTeamFromDbType(prisma.selectedTeam),
    };
  },
});
