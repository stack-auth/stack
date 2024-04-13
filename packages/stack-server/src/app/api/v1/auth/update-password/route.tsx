import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/access-token";
import { comparePassword, hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { prismaClient } from "@/prisma-client";
import { KnownError, PasswordFormatInvalidErrorCode, WrongPasswordErrorCode } from "@stackframe/stack-shared/dist/utils/types";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";

const postSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.default(undefined),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    oldPassword: yup.string().required(),
    newPassword: yup.string().required(),
  }).required(),
});

const handler = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
    },
    body: { 
      oldPassword,
      newPassword,
    },
  } = await deprecatedParseRequest(req, postSchema);

  if (!authorization) {
    return NextResponse.json(null);
  }

  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });
  if (!pkValid) {
    throw new StatusError(StatusError.Forbidden);
  }

  const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
  const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.Forbidden);
  }

  const passwordError = getPasswordError(newPassword);
  if (passwordError) {
    throw passwordError;
  }

  const user = await prismaClient.projectUser.findUnique({
    where: {
      projectId_projectUserId: {
        projectId,
        projectUserId: userId,
      },
    },
  });
  if (!user?.passwordHash) {
    throw new StatusError(StatusError.NotFound, "User is not signed in using password");
  }

  if (! await comparePassword(oldPassword, user.passwordHash)) {
    throw new KnownError(WrongPasswordErrorCode);
  }

  await prismaClient.projectUser.update({
    where: {
      projectId_projectUserId: {
        projectId,
        projectUserId: userId,
      },
    },
    data: {
      passwordHash: await hashPassword(newPassword),
    },
  });

  return NextResponse.json({});
});
export const POST = handler;
