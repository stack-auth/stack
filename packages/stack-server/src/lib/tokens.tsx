import * as yup from 'yup';
import { JWTExpired, JOSEError } from 'jose/errors';
import { decryptJWT, encryptJWT } from '@stackframe/stack-shared/dist/utils/jwt';
import { KnownErrors } from '@stackframe/stack-shared';
import { prismaClient } from '@/prisma-client';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';

export const authorizationHeaderSchema = yup.string().matches(/^StackSession [^ ]+$/);

const accessTokenSchema = yup.object({
  projectId: yup.string().required(),
  userId: yup.string().required(),
  exp: yup.number().required(),
});

export const oauthCookieSchema = yup.object({
  projectId: yup.string().required(),
  publishableClientKey: yup.string().required(),
  innerCodeVerifier: yup.string().required(),
  innerState: yup.string().required(),
  redirectUri: yup.string().required(),
  scope: yup.string().required(),
  state: yup.string().required(),
  grantType: yup.string().required(),
  codeChallenge: yup.string().required(),
  codeChallengeMethod: yup.string().required(),
  responseType: yup.string().required(),
  type: yup.string().oneOf(['authenticate', 'link']).required(),
  projectUserId: yup.string().optional(),
  providerScope: yup.string().optional(),
  errorRedirectUrl: yup.string().optional(),
  afterCallbackRedirectUrl: yup.string().optional(),
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
  return await encryptJWT({ projectId, userId }, process.env.STACK_ACCESS_TOKEN_EXPIRATION_TIME || '1h');
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
