import { fullProjectInclude, projectJsonFromDbType } from "@/lib/projects";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";

export const usersCrudHandlers = createPrismaCrudHandlers(usersCrud, "projectUser", {
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
  include: async () => ({}),
  createNotFoundError: () => new KnownErrors.UserNotFound(),
  crudToPrisma: async (crud, { auth }) => {
    const projectId = auth.project.id;
    return {
      displayName: crud.displayName,
      clientMetadata: crud.clientMetadata,
      projectId,
      primaryEmail: crud.primaryEmail,
      primaryEmailVerified: crud.primaryEmailVerified,
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
      oauthProviders: auth.project.evaluatedConfig.oauthProviders.map((provider) => provider.id),
    };
  },
});
