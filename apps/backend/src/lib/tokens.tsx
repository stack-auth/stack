import * as yup from 'yup';
import { JWTExpired, JOSEError } from 'jose/errors';
import { decryptJWT, encryptJWT } from '@stackframe/stack-shared/dist/utils/jwt';
import { KnownErrors } from '@stackframe/stack-shared';
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";
import { prismaClient } from '@/prisma-client';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';

export const authorizationHeaderSchema = yupString().matches(/^StackSession [^ ]+$/);

const accessTokenSchema = yupObject({
  projectId: yupString().required(),
  userId: yupString().required(),
  exp: yupNumber().required(),
});

export const oauthCookieSchema = yupObject({
  projectId: yupString().required(),
  publishableClientKey: yupString().required(),
  innerCodeVerifier: yupString().required(),
  redirectUri: yupString().required(),
  scope: yupString().required(),
  state: yupString().required(),
  grantType: yupString().required(),
  codeChallenge: yupString().required(),
  codeChallengeMethod: yupString().required(),
  responseType: yupString().required(),
  type: yupString().oneOf(['authenticate', 'link']).required(),
  projectUserId: yupString().optional(),
  providerScope: yupString().optional(),
  errorRedirectUrl: yupString().optional(),
  afterCallbackRedirectUrl: yupString().optional(),
});


export async function decodeAccessToken(accessToken: string) {
  let decoded;
  try {
    decoded = await decryptJWT(accessToken);
  } catch (error) {
    if (error instanceof JWTExpired) {
      throw new KnownErrors.AccessTokenExpired();
    } else if (error instanceof JOSEError) {
      throw new KnownErrors.UnparsableAccessToken();
    }
    throw error;
  }

  return await accessTokenSchema.validate(decoded);
}

export async function encodeAccessToken({
  projectId,
  userId,
}: {
  projectId: string,
  userId: string,
}) {
  // TODO: pass the scope and some other information down to the token
  return await encryptJWT({ projectId, userId }, getEnvVariable("STACK_ACCESS_TOKEN_EXPIRATION_TIME", "1h"));
}

export async function createAuthTokens({
  projectId,
  projectUserId,
}: {
  projectId: string,
  projectUserId: string,
}) {
  const refreshToken = generateSecureRandomString();
  const accessToken = await encodeAccessToken({
    projectId,
    userId: projectUserId,
  });

  await prismaClient.projectUserRefreshToken.create({
    data: {
      projectId,
      projectUserId,
      refreshToken: refreshToken,
    },
  });

  return { refreshToken, accessToken };
}
