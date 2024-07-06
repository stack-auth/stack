import { listManagedProjectIds } from "@/lib/projects";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { apiKeysCrud } from "@stackframe/stack-shared/dist/interface/crud/api-keys";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { throwIfUndefined } from "@stackframe/stack-shared/dist/utils/errors";

export const apiKeyCrudHandlers = createPrismaCrudHandlers(apiKeysCrud, "apiKeySet", {
  paramsSchema: yupObject({
    apiKeyId: yupString().required(),
  }),
  baseFields: async () => ({}),
  onPrepare: async ({ auth }) => {
    if (!auth.user) {
      throw new KnownErrors.UserAuthenticationRequired();
    }
  },
  where: async ({ auth }) => {
    const managedProjectIds = listManagedProjectIds(throwIfUndefined(auth.user, "auth.user"));
    return {
      projectId: auth.project.id,
      AND: {
        projectId: { in: managedProjectIds }
      }
    };
  },
  whereUnique: async ({ params, auth }) => {
    const managedProjectIds = listManagedProjectIds(throwIfUndefined(auth.user, "auth.user"));
    return {
      projectId_id: {
        projectId: auth.project.id,
        id: params.apiKeyId
      },
      AND: {
        projectId: { in: managedProjectIds }
      }
    };
  },
  include: async () => ({}),
  notFoundToCrud: () => {
    throw new KnownErrors.ApiKeyNotFound();
  },
  crudToPrisma: async (crud) => {
    return {
      description: crud.description,
    };
  },
  prismaToCrud: async (prisma) => {
    return {
      id: prisma.id,
      description: prisma.description,
      publishable_client_key: prisma.publishableClientKey ? {
        last_four: prisma.publishableClientKey.slice(-4),
      } : undefined,
      secret_server_key: prisma.secretServerKey ? {
        last_four: prisma.secretServerKey.slice(-4),
      } : undefined,
      super_secret_admin_key: prisma.superSecretAdminKey ? {
        last_four: prisma.superSecretAdminKey.slice(-4),
      } : undefined,
      created_at_millis: prisma.createdAt.getTime(),
      expires_at_millis: prisma.expiresAt.getTime(),
      manually_revoked_at_millis: prisma.manuallyRevokedAt?.getTime(),
    };
  },
});
