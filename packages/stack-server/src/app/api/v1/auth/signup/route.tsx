import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { prismaClient } from "@/prisma-client";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { createAuthTokens } from "@/lib/tokens";
import { sendVerificationEmail } from "@/email";
import { getProject } from "@/lib/projects";
import { validateUrl } from "@/utils/url";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { getApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared";

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
    throw passwordError;
  }

  if (!await getApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownErrors.ApiKeyNotFound();
  }

  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found"); // This should never happen, make typescript happy
  }

  if (!project.evaluatedConfig.credentialEnabled) {
    throw new StatusError(StatusError.Forbidden, "Password authentication is not enabled");
  }

  if (
    !validateUrl(
      emailVerificationRedirectUrl,
      project.evaluatedConfig.domains,
      project?.evaluatedConfig.allowLocalhost 
    )
  ) {
    throw new KnownErrors.RedirectUrlNotWhitelisted();
  }

  // TODO: make this a transaction
  const user = await prismaClient.projectUser.findUnique({
    where: {
      projectId_primaryEmail_authWithEmail: {
        projectId,
        primaryEmail: email,
        authWithEmail: true,
      },
    },
  });

  if (user) {
    throw new KnownErrors.UserEmailAlreadyExists();
  }

  const newUser = await prismaClient.projectUser.create({
    data: {
      projectId,
      projectUserId: generateUuid(),
      primaryEmail: email,
      primaryEmailVerified: false,
      passwordHash: await hashPassword(password),
      authWithEmail: true,
    },
  });

  const { refreshToken, accessToken } = await createAuthTokens({ projectId, projectUserId: newUser.projectUserId });

  try {
    await sendVerificationEmail(projectId, newUser.projectUserId, emailVerificationRedirectUrl);
  } catch (error) {
    console.error(error);
  }

  return NextResponse.json({
    access_token: accessToken, // backwards compatibility
    refresh_token: refreshToken, // backwards compatibility
    accessToken,
    refreshToken,
  });
});
