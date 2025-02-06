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
import { Tenancy } from './tenancies';

export const authorizationHeaderSchema = yupString().matches(/^StackSession [^ ]+$/);

const accessTokenSchema = yupObject({
  projectId: yupString().defined(),
  userId: yupString().defined(),
  exp: yupNumber().defined(),
});

export const oauthCookieSchema = yupObject({
  tenancyId: yupString().defined(),
  publishableClientKey: yupString().defined(),
  innerCodeVerifier: yupString().defined(),
  redirectUri: yupString().defined(),
  scope: yupString().defined(),
  state: yupString().defined(),
  grantType: yupString().defined(),
  codeChallenge: yupString().defined(),
  codeChallengeMethod: yupString().defined(),
  responseType: yupString().defined(),
  type: yupString().oneOf(['authenticate', 'link']).defined(),
  projectUserId: yupString().optional(),
  providerScope: yupString().optional(),
  errorRedirectUrl: yupString().optional(),
  afterCallbackRedirectUrl: yupString().optional(),
});

const jwtIssuer = "https://access-token.jwt-signature.stack-auth.com";

export async function decodeAccessToken(accessToken: string) {
  let payload: jose.JWTPayload;
  let decoded: jose.JWTPayload | undefined;
  try {
    decoded = jose.decodeJwt(accessToken);

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
      return Result.error(new KnownErrors.AccessTokenExpired(decoded?.exp ? new Date(decoded.exp * 1000) : undefined));
    } else if (error instanceof JOSEError) {
      return Result.error(new KnownErrors.UnparsableAccessToken());
    }
    throw error;
  }

  const result = await accessTokenSchema.validate({
    projectId: payload.aud || payload.projectId,
    userId: payload.sub,
    branchId: payload.branchId ?? "main",  // TODO remove this once old tokens have expired
    refreshTokenId: payload.refreshTokenId,
    exp: payload.exp,
  });

  return Result.ok(result);
}

export async function generateAccessToken(options: {
  tenancy: Tenancy,
  userId: string,
  useLegacyGlobalJWT: boolean,
}) {
  await logEvent(
    [SystemEventTypes.UserActivity],
    {
      projectId: options.tenancy.project.id,
      branchId: options.tenancy.branchId,
      userId: options.userId,
    }
  );

  if (options.useLegacyGlobalJWT) {
    return await legacySignGlobalJWT(
      jwtIssuer,
      { projectId: options.tenancy.project.id, sub: options.userId, branchId: options.tenancy.branchId },
      getEnvVariable("STACK_ACCESS_TOKEN_EXPIRATION_TIME", "10min")
    );
  } else {
    return await signJWT({
      issuer: jwtIssuer,
      audience: options.tenancy.project.id,
      payload: { sub: options.userId, branchId: options.tenancy.branchId },
      expirationTime: getEnvVariable("STACK_ACCESS_TOKEN_EXPIRATION_TIME", "10min"),
    });
  }
}

export async function createAuthTokens(options: {
  tenancy: Tenancy,
  projectUserId: string,
  useLegacyGlobalJWT: boolean,
  expiresAt?: Date,
}) {
  options.expiresAt ??= new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

  const refreshToken = generateSecureRandomString();
  const accessToken = await generateAccessToken({
    tenancy: options.tenancy,
    userId: options.projectUserId,
    useLegacyGlobalJWT: options.useLegacyGlobalJWT,
  });

  await prismaClient.projectUserRefreshToken.create({
    data: {
      tenancyId: options.tenancy.id,
      projectUserId: options.projectUserId,
      refreshToken: refreshToken,
      expiresAt: options.expiresAt,
    },
  });

  return { refreshToken, accessToken };
}
