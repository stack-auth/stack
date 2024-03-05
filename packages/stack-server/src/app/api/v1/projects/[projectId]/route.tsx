import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { parseRequest, smartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema, superSecretAdminKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin, updateProject } from "@/lib/projects";
import { ClientProjectJson, SharedProvider, StandardProvider, sharedProviders, standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ProjectIdOrKeyInvalidErrorCode, KnownError } from "@stackframe/stack-shared/dist/utils/types";
import { OauthProviderUpdateOptions, ProjectUpdateOptions } from "@stackframe/stack-shared/dist/interface/adminInterface";

const putOrGetSchema = yup.object({
  headers: yup.object({
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-super-secret-admin-key": superSecretAdminKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    isProductionMode: yup.boolean().optional(),
    config: yup.object({
      domains: yup.array(yup.object({
        domain: yup.string().required(),
        handlerPath: yup.string().required(),
      })).optional(),
      oauthProviders: yup.array(
        yup.object({
          id: yup.string().required(),
          type: yup.string().required(),
          clientId: yup.string().optional(),
          clientSecret: yup.string().optional(),
          tenantId: yup.string().optional(),
        })
      ).optional(),
      credentialEnabled: yup.boolean().optional(),
    }).optional(),
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

  const typedUpdate: ProjectUpdateOptions = {
    isProductionMode: update.isProductionMode,
    config: update.config && {
      domains: update.config.domains,
      oauthProviders: update.config.oauthProviders && update.config.oauthProviders.map((provider) => {
        if (sharedProviders.includes(provider.type)) {
          return {
            id: provider.id,
            type: provider.type as SharedProvider,
          };
        } else if (standardProviders.includes(provider.type)) {
          if (!provider.clientId) {
            throw new StatusError(StatusError.BadRequest, "Missing clientId");
          }
          if (!provider.clientSecret) {
            throw new StatusError(StatusError.BadRequest, "Missing clientSecret");
          }
          
          return {
            id: provider.id,
            type: provider.type as StandardProvider,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            tenantId: provider.tenantId,
          };
        } else {
          throw new StatusError(StatusError.BadRequest, "Invalid oauth provider type");
        }
      }),
      credentialEnabled: update.config.credentialEnabled,
    },
  };

  if (asValid || saValid) {
    const project = await updateProject(
      projectId,
      typedUpdate,
    );
    return NextResponse.json(project);
  } else if (asValid || pkValid) {
    if (Object.entries(update).length !== 0) {
      throw new StatusError(StatusError.Forbidden, "Can't update project with only publishable client key");
    }
    const project = await updateProject(projectId, {});
    if (!project) {
      throw new Error("Project not found but the API key was valid? Something weird happened");
    }
    const clientProject: ClientProjectJson = {
      id: project.id,
      credentialEnabled: project.evaluatedConfig.credentialEnabled,
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
    throw new StatusError(StatusError.Forbidden, "Invalid API key");
  }
});
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
