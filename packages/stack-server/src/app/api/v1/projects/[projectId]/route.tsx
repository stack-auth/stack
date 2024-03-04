import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { parseRequest, smartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema, superSecretAdminKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin, updateProject } from "@/lib/projects";
import { ClientProjectJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ProjectIdOrKeyInvalidErrorCode, KnownError } from "@stackframe/stack-shared/dist/utils/types";

const putOrGetSchema = yup.object({
  headers: yup.object({
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-super-secret-admin-key": superSecretAdminKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    isProductionMode: yup.boolean().default(undefined),
    config: yup.object({
      domains: yup.array(yup.object({
        domain: yup.string().required(),
        handlerPath: yup.string().required(),
      })).default(undefined),
    }).default(undefined),
  }).nullable(),
});

const handler = smartRouteHandler(async (req: NextRequest, options: { params: { apiKeyId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
      "x-stack-super-secret-admin-key": superSecretAdminKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    body,
  } = await parseRequest(req, putOrGetSchema);

  const update = body ?? {};

  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);
  const saValid = await checkApiKeySet(projectId, { superSecretAdminKey });

  if (asValid || saValid) {
    const project = await updateProject(
      projectId,
      update,
    );
    return NextResponse.json(project);
  } else if (pkValid) {
    if (Object.entries(update).length !== 0) {
      throw new StatusError(StatusError.Forbidden);
    }
    const project = await updateProject(projectId, {});
    if (!project) {
      throw new Error("Project not found"); // This should never happen, make typescript happy
    }
    const clientProject: ClientProjectJson = {
      id: project.id,
      oauthProviders: project.evaluatedConfig.oauthProviders.map(
        (provider) => ({
          id: provider.id,
        }),
      ),
    };

    return NextResponse.json(clientProject);
  } else {
    if (projectId.length !== 0 && publishableClientKey.length !== 0) {
      throw new KnownError(ProjectIdOrKeyInvalidErrorCode);
    }
    throw new StatusError(StatusError.Forbidden);
  }
});
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
