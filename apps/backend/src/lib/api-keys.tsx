// TODO remove and replace with CRUD handler
import { ApiKeySet } from "@prisma/client";
import { ApiKeyCreateCrudResponse } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { ApiKeysCrud } from "@stackframe/stack-shared/dist/interface/crud/api-keys";
import { yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { prismaClient } from "@/prisma-client";

export const publishableClientKeyHeaderSchema = yupString().matches(/^[a-zA-Z0-9_-]*$/);
export const secretServerKeyHeaderSchema = publishableClientKeyHeaderSchema;
export const superSecretAdminKeyHeaderSchema = secretServerKeyHeaderSchema;

export async function checkApiKeySet(...args: Parameters<typeof getApiKeySet>): Promise<boolean> {
  const set = await getApiKeySet(...args);
  if (!set) return false;
  if (set.manually_revoked_at_millis) return false;
  if (set.expires_at_millis < Date.now()) return false;
  return true;
}

type KeyType = { publishableClientKey: string } | { secretServerKey: string } | { superSecretAdminKey: string };

function assertKeyType(obj: any): KeyType {
  if (typeof obj !== "object" || obj === null) {
    throw new StackAssertionError("Invalid key type", { obj });
  }
  const entries = Object.entries(obj);
  if (entries.length !== 1) {
    throw new StackAssertionError("Invalid key type; must have exactly one entry", { obj });
  }
  const [key, value] = entries[0];
  if (!typedIncludes(["publishableClientKey", "secretServerKey", "superSecretAdminKey"], key)) {
    throw new StackAssertionError("Invalid key type; field must be one of the three key types", { obj });
  }
  if (typeof value !== "string") {
    throw new StackAssertionError("Invalid key type; field must be a string", { obj });
  }
  return {
    [key]: value,
  } as KeyType;
}

export async function getApiKeySet(projectId: string, whereOrId: string | KeyType): Promise<ApiKeysCrud["Admin"]["Read"] | null> {
  const where =
    typeof whereOrId === "string"
      ? {
          projectId_id: {
            projectId,
            id: whereOrId,
          },
        }
      : {
          ...assertKeyType(whereOrId),
          projectId,
        };

  const set = await prismaClient.apiKeySet.findUnique({
    where,
  });

  if (!set) {
    return null;
  }

  return createSummaryFromDbType(set);
}

export async function listApiKeySets(projectId: string): Promise<ApiKeysCrud["Admin"]["Read"][]> {
  const sets = await prismaClient.apiKeySet.findMany({
    where: {
      projectId,
    },
  });

  return sets.map(createSummaryFromDbType);
}

export async function createApiKeySet(
  projectId: string,
  description: string,
  expiresAt: Date,
  hasPublishableClientKey: boolean,
  hasSecretServerKey: boolean,
  hasSuperSecretAdminKey: boolean,
): Promise<ApiKeyCreateCrudResponse> {
  const set = await prismaClient.apiKeySet.create({
    data: {
      id: generateUuid(),
      projectId,
      description,
      expiresAt,
      ...(hasPublishableClientKey
        ? {
            publishableClientKey: `pck_${generateSecureRandomString()}`,
          }
        : {}),
      ...(hasSecretServerKey
        ? {
            secretServerKey: `ssk_${generateSecureRandomString()}`,
          }
        : {}),
      ...(hasSuperSecretAdminKey
        ? {
            superSecretAdminKey: `sak_${generateSecureRandomString()}`,
          }
        : {}),
    },
  });

  return {
    id: set.id,
    ...(set.publishableClientKey
      ? {
          publishableClientKey: set.publishableClientKey,
        }
      : {}),
    ...(set.secretServerKey
      ? {
          secretServerKey: set.secretServerKey,
        }
      : {}),
    ...(set.superSecretAdminKey
      ? {
          superSecretAdminKey: set.superSecretAdminKey,
        }
      : {}),
    created_at_millis: set.createdAt.getTime(),
    expires_at_millis: set.expiresAt.getTime(),
    description: set.description,
    manually_revoked_at_millis: set.manuallyRevokedAt?.getTime() ?? undefined,
  };
}

export async function revokeApiKeySet(projectId: string, apiKeyId: string) {
  const set = await prismaClient.apiKeySet.update({
    where: {
      projectId_id: {
        projectId,
        id: apiKeyId,
      },
    },
    data: {
      manuallyRevokedAt: new Date(),
    },
  });

  return createSummaryFromDbType(set);
}

function createSummaryFromDbType(set: ApiKeySet): ApiKeysCrud["Admin"]["Read"] {
  return {
    id: set.id,
    description: set.description,
    publishable_client_key:
      set.publishableClientKey === null
        ? undefined
        : {
            last_four: set.publishableClientKey.slice(-4),
          },
    secret_server_key:
      set.secretServerKey === null
        ? undefined
        : {
            last_four: set.secretServerKey.slice(-4),
          },
    super_secret_admin_key:
      set.superSecretAdminKey === null
        ? undefined
        : {
            last_four: set.superSecretAdminKey.slice(-4),
          },
    created_at_millis: set.createdAt.getTime(),
    expires_at_millis: set.expiresAt.getTime(),
    manually_revoked_at_millis: set.manuallyRevokedAt?.getTime() ?? undefined,
  };
}
