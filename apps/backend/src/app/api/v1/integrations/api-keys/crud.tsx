import { prismaClient } from "@/prisma-client";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { CrudTypeOf, createCrud } from "@stackframe/stack-shared/dist/crud";
import { yupBoolean, yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";

const baseApiKeysReadSchema = yupObject({
  id: yupString().defined(),
  description: yupString().defined(),
  expires_at_millis: yupNumber().defined(),
  manually_revoked_at_millis: yupNumber().optional(),
  created_at_millis: yupNumber().defined(),
});

// Used for the result of the create endpoint
export const apiKeysCreateInputSchema = yupObject({
  description: yupString().defined(),
  expires_at_millis: yupNumber().defined(),
  has_publishable_client_key: yupBoolean().defined(),
  has_secret_server_key: yupBoolean().defined(),
  has_super_secret_admin_key: yupBoolean().defined(),
});

export const apiKeysCreateOutputSchema = baseApiKeysReadSchema.concat(yupObject({
  publishable_client_key: yupString().optional(),
  secret_server_key: yupString().optional(),
  super_secret_admin_key: yupString().optional(),
}).defined());

// Used for list, read and update endpoints after the initial creation
export const apiKeysCrudAdminObfuscatedReadSchema = baseApiKeysReadSchema.concat(yupObject({
  publishable_client_key: yupObject({
    last_four: yupString().defined(),
  }).optional(),
  secret_server_key: yupObject({
    last_four: yupString().defined(),
  }).optional(),
  super_secret_admin_key: yupObject({
    last_four: yupString().defined(),
  }).optional(),
}));

export const apiKeysCrudAdminUpdateSchema = yupObject({
  description: yupString().optional(),
  revoked: yupBoolean().oneOf([true]).optional(),
}).defined();

export const apiKeysCrudAdminDeleteSchema = yupMixed();

export const apiKeysCrud = createCrud({
  adminReadSchema: apiKeysCrudAdminObfuscatedReadSchema,
  adminUpdateSchema: apiKeysCrudAdminUpdateSchema,
  adminDeleteSchema: apiKeysCrudAdminDeleteSchema,
  docs: {
    adminList: {
      hidden: true,
    },
    adminRead: {
      hidden: true,
    },
    adminCreate: {
      hidden: true,
    },
    adminUpdate: {
      hidden: true,
    },
    adminDelete: {
      hidden: true,
    },
  },
});
export type ApiKeysCrud = CrudTypeOf<typeof apiKeysCrud>;


export const apiKeyCrudHandlers = createLazyProxy(() => createPrismaCrudHandlers(apiKeysCrud, "apiKeySet", {
  paramsSchema: yupObject({
    api_key_id: yupString().uuid().defined(),
  }),
  baseFields: async () => ({}),
  where: async ({ auth }) => {
    return {
      projectId: auth.project.id,
    };
  },
  whereUnique: async ({ params, auth }) => {
    return {
      projectId_id: {
        projectId: auth.project.id,
        id: params.api_key_id,
      },
    };
  },
  include: async () => ({}),
  notFoundToCrud: () => {
    throw new KnownErrors.ApiKeyNotFound();
  },
  orderBy: async () => {
    return {
      createdAt: 'desc',
    };
  },
  crudToPrisma: async (crud, { auth, type, params }) => {
    let old;
    if (type === 'create') {
      old = await prismaClient.apiKeySet.findUnique({
        where: {
          projectId_id: {
            projectId: auth.project.id,
            id: params.api_key_id ?? throwErr('params.apiKeyId is required for update')
          },
        },
      });
    }

    return {
      description: crud.description,
      manuallyRevokedAt: old?.manuallyRevokedAt ? undefined : (crud.revoked ? new Date() : undefined),
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
}));
