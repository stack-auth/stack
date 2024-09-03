import { JOSEError, JWTExpired } from "jose/errors";
import { KnownErrors } from "@stackframe/stack-shared";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { decryptJWT, encryptJWT } from "@stackframe/stack-shared/dist/utils/jwt";
import { prismaClient } from "@/prisma-client";
import { SystemEventTypes, logEvent } from "./events";

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
  type: yupString().oneOf(["authenticate", "link"]).required(),
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

export async function generateAccessToken({ projectId, userId }: { projectId: string; userId: string }) {
  await logEvent([SystemEventTypes.UserActivity], { projectId, userId });

  // TODO: pass the scope and some other information down to the token
  return await encryptJWT({ projectId, userId }, getEnvVariable("STACK_ACCESS_TOKEN_EXPIRATION_TIME", "1h"));
}

export async function createAuthTokens({
  projectId,
  projectUserId,
  expiresAt,
}: {
  projectId: string;
  projectUserId: string;
  expiresAt?: Date;
}) {
  expiresAt ??= new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

  const refreshToken = generateSecureRandomString();
  const accessToken = await generateAccessToken({
    projectId,
    userId: projectUserId,
  });

  await prismaClient.projectUserRefreshToken.create({
    data: {
      projectId,
      projectUserId,
      refreshToken: refreshToken,
      expiresAt,
    },
  });

  return { refreshToken, accessToken };
}
