import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { 
  KnownError, 
  ProjectIdOrKeyInvalidErrorCode, 
  RedirectUrlInvalidErrorCode, 
  UserNotExistErrorCode
} from "stack-shared/dist/utils/types";
import { prismaClient } from "@/prisma-client";
import { parseRequest, smartRouteHandler } from "@/lib/route-handlers";
import { sendPasswordResetEmail } from "@/email";
import { getApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { getProject } from "@/lib/projects";
import { validateUrl } from "@/utils/url";

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

export const POST = smartRouteHandler(async (req: NextRequest) => {
  const { 
    headers: { 
      "x-stack-project-id": projectId, 
      "x-stack-publishable-client-key": publishableClientKey 
    },
    body: { 
      email,
      redirectUrl
    } 
  } = await parseRequest(req, postSchema);
  
  if (!await getApiKeySet(projectId, { publishableClientKey })) {
    throw new KnownError(ProjectIdOrKeyInvalidErrorCode);
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
    throw new KnownError(UserNotExistErrorCode);
  }

  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found"); // This should never happen, make typescript happy
  }

  if (
    !validateUrl(
      redirectUrl, 
      project.evaluatedConfig.domains,
      project.evaluatedConfig.allowLocalhost 
    )
  ) {
    throw new KnownError(RedirectUrlInvalidErrorCode);
  }
  
  await sendPasswordResetEmail(projectId, user.projectUserId, redirectUrl);

  return new NextResponse();
});
