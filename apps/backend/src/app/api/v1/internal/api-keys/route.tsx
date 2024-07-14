import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { apiKeysCreateInputSchema, apiKeysCreateOutputSchema } from "@stackframe/stack-shared/dist/interface/crud/api-keys";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { prismaClient } from "@/prisma-client";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { apiKeyCrudHandlers } from "./crud";

export const GET = apiKeyCrudHandlers.listHandler;

export const POST = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema.required(),
    }).required(),
    body: apiKeysCreateInputSchema.required(),
    method: yupString().oneOf(["POST"]).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: apiKeysCreateOutputSchema.required(),
  }),
  handler: async ({ auth, body }) => {
    const set = await prismaClient.apiKeySet.create({
      data: {
        id: generateUuid(),
        projectId: auth.project.id,
        description: body.description,
        expiresAt: new Date(body.expires_at_millis),
        publishableClientKey: body.has_publishable_client_key ? `pck_${generateSecureRandomString()}` : undefined,
        secretServerKey: body.has_secret_server_key ? `ssk_${generateSecureRandomString()}` : undefined,
        superSecretAdminKey: body.has_super_secret_admin_key ? `sak_${generateSecureRandomString()}` : undefined,
      },
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        id: set.id,
        description: set.description,
        publishable_client_key: set.publishableClientKey || undefined,
        secret_server_key: set.secretServerKey || undefined,
        super_secret_admin_key: set.superSecretAdminKey || undefined,
        created_at_millis: set.createdAt.getTime(),
        expires_at_millis: set.expiresAt.getTime(),
        manually_revoked_at_millis: set.manuallyRevokedAt?.getTime(),
      }
    } as const;
  },
});
