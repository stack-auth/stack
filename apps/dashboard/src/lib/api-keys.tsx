import * as yup from 'yup';
import { ApiKeySetFirstViewJson, ApiKeySetJson } from '@/temporary-types';
import { ApiKeySet } from '@prisma/client';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { prismaClient } from '@/prisma-client';
import { generateUuid } from '@stackframe/stack-shared/dist/utils/uuids';

export const publishableClientKeyHeaderSchema = yup.string().matches(/^[a-zA-Z0-9_-]*$/);
export const secretServerKeyHeaderSchema = publishableClientKeyHeaderSchema;
export const superSecretAdminKeyHeaderSchema = secretServerKeyHeaderSchema;

export async function checkApiKeySet(
  ...args: Parameters<typeof getApiKeySet>
): Promise<boolean> {
  const set = await getApiKeySet(...args);
  if (!set) return false;
  if (set.manuallyRevokedAtMillis) return false;
  if (set.expiresAtMillis < Date.now()) return false;
  return true;
}


export async function getApiKeySet(
  projectId: string,
  whereOrId:
    | string
    | { publishableClientKey: string }
    | { secretServerKey: string }
    | { superSecretAdminKey: string },
): Promise<ApiKeySetJson | null> {
  const where = typeof whereOrId === 'string'
    ? {
      projectId_id: {
        projectId,
        id: whereOrId,
      }
    }
    : whereOrId;

  const set = await prismaClient.apiKeySet.findUnique({
    where,
  });

  if (!set) {
    return null;
  }

  return createSummaryFromDbType(set);
}

export async function listApiKeySets(
  projectId: string,
): Promise<ApiKeySetJson[]> {
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
): Promise<ApiKeySetFirstViewJson> {
  const set = await prismaClient.apiKeySet.create({
    data: {
      id: generateUuid(),
      projectId,
      description,
      expiresAt,
      ...hasPublishableClientKey ? {
        publishableClientKey: `pck_${generateSecureRandomString()}`,
      } : {},
      ...hasSecretServerKey ? {
        secretServerKey: `ssk_${generateSecureRandomString()}`,
      } : {},
      ...hasSuperSecretAdminKey ? {
        superSecretAdminKey: `sak_${generateSecureRandomString()}`,
      } : {},
    },
  });

  return {
    id: set.id,
    ...set.publishableClientKey ? {
      publishableClientKey: set.publishableClientKey,
    } : {},
    ...set.secretServerKey ? {
      secretServerKey: set.secretServerKey,
    } : {},
    ...set.superSecretAdminKey ? {
      superSecretAdminKey: set.superSecretAdminKey,
    } : {},
    createdAtMillis: set.createdAt.getTime(),
    expiresAtMillis: set.expiresAt.getTime(),
    description: set.description,
    manuallyRevokedAtMillis: set.manuallyRevokedAt?.getTime() ?? null,
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

function createSummaryFromDbType(set: ApiKeySet): ApiKeySetJson {
  return {
    id: set.id,
    description: set.description,
    publishableClientKey: set.publishableClientKey === null ? null : {
      lastFour: set.publishableClientKey.slice(-4),
    },
    secretServerKey: set.secretServerKey === null ? null : {
      lastFour: set.secretServerKey.slice(-4),
    },
    superSecretAdminKey: set.superSecretAdminKey === null ? null : {
      lastFour: set.superSecretAdminKey.slice(-4),
    },
    createdAtMillis: set.createdAt.getTime(),
    expiresAtMillis: set.expiresAt.getTime(),
    manuallyRevokedAtMillis: set.manuallyRevokedAt?.getTime() ?? null,
  };
}
