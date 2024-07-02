import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { sendPasswordResetEmail } from "@/lib/emails";
import { getApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { getProject } from "@/lib/projects";
import { validateUrl } from "@/lib/utils";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared";

const postSchema = yup.object({
  headers: yup.object({
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    email: yup.string().required(),
    redirectUrl: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { 
    headers: { 
      "x-stack-project-id": projectId, 
      "x-stack-publishable-client-key": publishableClientKey 
    },
    body: { 
      email,
      redirectUrl
    } 
  } = await deprecatedParseRequest(req, postSchema);
  
  if (!await getApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownErrors.ApiKeyNotFound();
  }

  const project = await getProject(projectId);
  if (!project) {
    throw new StackAssertionError("Project not found"); // This should never happen, make typescript happy
  }

  if (!project.evaluatedConfig.credentialEnabled) {
    throw new StatusError(StatusError.Forbidden, "Password authentication is not enabled");
  }

  const user = await prismaClient.projectUser.findFirst({
    where: {
      projectId,
      primaryEmail: email,
      passwordHash: {
        not: null,
      },
    },
  });

  if (!user) {
    throw new KnownErrors.UserNotFound();
  }

  if (
    !validateUrl(
      redirectUrl, 
      project.evaluatedConfig.domains,
      project.evaluatedConfig.allowLocalhost 
    )
  ) {
    throw new KnownErrors.RedirectUrlNotWhitelisted();
  }
  
  await sendPasswordResetEmail(projectId, user.projectUserId, redirectUrl);

  return new NextResponse();
});
