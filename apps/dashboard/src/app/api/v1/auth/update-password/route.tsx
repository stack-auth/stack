import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/tokens";
import { comparePassword, hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { prismaClient } from "@/prisma-client";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { KnownErrors } from "@stackframe/stack-shared";

const postSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.optional(),
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
    throw new KnownErrors.PasswordMismatch();
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
