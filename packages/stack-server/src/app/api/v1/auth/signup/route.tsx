import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { PasswordFormatInvalidErrorCode, ProjectIdOrKeyInvalidErrorCode, RedirectUrlInvalidErrorCode, KnownError, UserAlreadyExistErrorCode } from "stack-shared/dist/utils/types";
import { generateSecureRandomString } from "stack-shared/dist/utils/crypto";
import { generateUuid } from "stack-shared/dist/utils/uuids";
import { hashPassword } from "stack-shared/dist/utils/password";
import { prismaClient } from "@/prisma-client";
import { parseRequest, smartRouteHandler } from "@/lib/route-handlers";
import { encodeAccessToken } from "@/lib/access-token";
import { sendVerificationEmail } from "@/email";
import { getProject } from "@/lib/projects";
import { validateUrl } from "@/utils/url";
import { getPasswordError } from "stack-shared/src/helpers/password";
import { getApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";

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

export const POST = smartRouteHandler(async (req: NextRequest) => {
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
  } = await parseRequest(req, postSchema);

  const passwordError = getPasswordError(password);
  if (passwordError) {
    throw new KnownError(PasswordFormatInvalidErrorCode);
  }

  if (!await getApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownError(ProjectIdOrKeyInvalidErrorCode);
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

  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found"); // This should never happen, make typescript happy
  }

  if (
    !validateUrl(
      emailVerificationRedirectUrl,
      project.evaluatedConfig.domains,
      project?.evaluatedConfig.allowLocalhost 
    )
  ) {
    throw new KnownError(RedirectUrlInvalidErrorCode);
  }

  await sendVerificationEmail(projectId, newUser.projectUserId, emailVerificationRedirectUrl,);

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
});
