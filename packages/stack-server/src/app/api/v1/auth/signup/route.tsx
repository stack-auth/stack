import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { PasswordFormatInvalidErrorCode, ProjectIdOrKeyInvalidErrorCode, RedirectUrlInvalidErrorCode, KnownError, UserAlreadyExistErrorCode } from "@stackframe/stack-shared/dist/utils/types";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { prismaClient } from "@/prisma-client";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { encodeAccessToken } from "@/lib/access-token";
import { sendVerificationEmail } from "@/email";
import { getProject } from "@/lib/projects";
import { validateUrl } from "@/utils/url";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { getApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

const postSchema = yup.object({
  headers: yup.object({
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    email: yup.string().email().required(),
    password: yup.string().required(),
    emailVerificationRedirectUrl: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { 
    body: {
      email, 
      password, 
      emailVerificationRedirectUrl,
    },
    headers: { 
      "x-stack-project-id": projectId, 
      "x-stack-publishable-client-key": publishableClientKey 
    }
  } = await deprecatedParseRequest(req, postSchema);

  const passwordError = getPasswordError(password);
  if (passwordError) {
    throw new KnownError(PasswordFormatInvalidErrorCode);
  }

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

  // TODO: make this a transaction
  // TODO: make this an upsert instead of two queries
  const user = await prismaClient.projectUser.findFirst({
    where: {
      projectId,
      primaryEmail: email,
      passwordHash: { not: null },
    },
  });

  if (user) {
    throw new KnownError(UserAlreadyExistErrorCode);
  }

  const newUser = await prismaClient.projectUser.create({
    data: {
      projectId,
      projectUserId: generateUuid(),
      primaryEmail: email,
      primaryEmailVerified: false,
      passwordHash: await hashPassword(password),
    },
  });

  const refreshToken =  await generateSecureRandomString();
  const accessToken = await encodeAccessToken({
    projectId,
    userId: newUser.projectUserId,
  });

  await prismaClient.projectUserRefreshToken.create({
    data: {
      projectId,
      projectUserId: newUser.projectUserId,
      refreshToken: refreshToken,
    },
  });

  if (
    !validateUrl(
      emailVerificationRedirectUrl,
      project.evaluatedConfig.domains,
      project?.evaluatedConfig.allowLocalhost 
    )
  ) {
    throw new KnownError(RedirectUrlInvalidErrorCode);
  }

  await sendVerificationEmail(projectId, newUser.projectUserId, emailVerificationRedirectUrl);

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
});
