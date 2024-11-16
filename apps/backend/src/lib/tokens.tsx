import { prismaClient } from '@/prisma-client';
import { KnownErrors } from '@stackframe/stack-shared';
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { legacySignGlobalJWT, legacyVerifyGlobalJWT, signJWT, verifyJWT } from '@stackframe/stack-shared/dist/utils/jwt';
import { Result } from '@stackframe/stack-shared/dist/utils/results';
import * as jose from 'jose';
import { JOSEError, JWTExpired } from 'jose/errors';
import { SystemEventTypes, logEvent } from './events';

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

const jwtIssuer = "https://access-token.jwt-signature.stack-auth.com";

export async function decodeAccessToken(accessToken: string) {
  let payload;
  try {
    const decoded = jose.decodeJwt(accessToken);

    if (!decoded.aud) {
      payload = await legacyVerifyGlobalJWT(jwtIssuer, accessToken);
    } else {
      payload = await verifyJWT({
        issuer: jwtIssuer,
        jwt: accessToken,
      });
    }
  } catch (error) {
    if (error instanceof JWTExpired) {
      return Result.error(new KnownErrors.AccessTokenExpired());
    } else if (error instanceof JOSEError) {
      return Result.error(new KnownErrors.UnparsableAccessToken());
    }
    throw error;
  }

  const result = await accessTokenSchema.validate({
    projectId: payload.aud || payload.projectId,
    userId: payload.sub,
    refreshTokenId: payload.refreshTokenId,
    exp: payload.exp,
  });

  return Result.ok(result);
}

export async function generateAccessToken(options: {
  projectId: string,
  useLegacyGlobalJWT: boolean,
  userId: string,
}) {
  await logEvent([SystemEventTypes.UserActivity], { projectId: options.projectId, userId: options.userId });

  if (options.useLegacyGlobalJWT) {
    return await legacySignGlobalJWT(
      jwtIssuer,
      { projectId: options.projectId, sub: options.userId },
      getEnvVariable("STACK_ACCESS_TOKEN_EXPIRATION_TIME", "10min")
    );
  } else {
    return await signJWT({
      issuer: jwtIssuer,
      audience: options.projectId,
      payload: { sub: options.userId },
      expirationTime: getEnvVariable("STACK_ACCESS_TOKEN_EXPIRATION_TIME", "10min"),
    });
  }
}

export async function createAuthTokens(options: {
  projectId: string,
  projectUserId: string,
  useLegacyGlobalJWT: boolean,
  expiresAt?: Date,
}) {
  options.expiresAt ??= new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

  const refreshToken = generateSecureRandomString();
  const accessToken = await generateAccessToken({
    projectId: options.projectId,
    userId: options.projectUserId,
    useLegacyGlobalJWT: options.useLegacyGlobalJWT,
  });

  await prismaClient.projectUserRefreshToken.create({
    data: {
      projectId: options.projectId,
      projectUserId: options.projectUserId,
      refreshToken: refreshToken,
      expiresAt: options.expiresAt,
    },
  });

  return { refreshToken, accessToken };
}
