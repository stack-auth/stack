import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/emails";
import { KnownErrors } from "@stackframe/stack-shared";
import { prismaClient } from "@/prisma-client";

const postSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.optional(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    emailVerificationRedirectUrl: yup.string().required(),
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
      emailVerificationRedirectUrl 
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

  const user = await prismaClient.projectUser.findUnique({
    where: {
      projectId_projectUserId: {
        projectId,
        projectUserId: userId,
      },
    },
  });
  
  if (!user) {
    throw new StatusError(StatusError.NotFound);
  }
  if (user.primaryEmailVerified) {
    throw new KnownErrors.EmailAlreadyVerified();
  }

  await sendVerificationEmail(projectId, userId, emailVerificationRedirectUrl);

  return NextResponse.json({});
});
export const POST = handler;
