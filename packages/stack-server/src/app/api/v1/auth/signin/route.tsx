import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { ProjectIdOrKeyInvalidErrorCode, KnownError, UserNotExistErrorCode, EmailPasswordMissMatchErrorCode } from "@stackframe/stack-shared/dist/utils/types";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { comparePassword } from "@stackframe/stack-shared/dist/utils/password";
import { prismaClient } from "@/prisma-client";
import { parseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { encodeAccessToken } from "@/lib/access-token";
import { getApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { getProject } from "@/lib/projects";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

const postSchema = yup.object({
  headers: yup.object({
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    email: yup.string().email().required(),
    password: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { 
    body: { 
      email,
      password
    }, 
    headers: { 
      "x-stack-project-id": projectId, 
      "x-stack-publishable-client-key": publishableClientKey 
    }
  } = await parseRequest(req, postSchema);

  if (!await getApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownError(ProjectIdOrKeyInvalidErrorCode);
  }

  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found"); // This should never happen, make typescript happy
  }

  if (!project.evaluatedConfig.credentialEnabled) {
    throw new StatusError(StatusError.Forbidden, "Password authentication is not enabled");
  }

  const user = await prismaClient.projectUser.findFirst({
    where: {
      projectId,
      primaryEmail: email,
      passwordHash: { not: null },
    },
  });
  if (!user) {
    throw new KnownError(UserNotExistErrorCode);
  }

  if (! await comparePassword(password, user.passwordHash || "")) {
    throw new KnownError(EmailPasswordMissMatchErrorCode);
  }

  const refreshToken =  await generateSecureRandomString();
  const accessToken = await encodeAccessToken({
    projectId,
    userId: user.projectUserId,
  });

  await prismaClient.projectUserRefreshToken.create({
    data: {
      projectId,
      projectUserId: user.projectUserId,
      refreshToken: refreshToken,
    },
  });

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
});
