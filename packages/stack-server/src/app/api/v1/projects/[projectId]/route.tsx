import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema, secretServerKeyHeaderSchema, superSecretAdminKeyHeaderSchema } from "@/lib/api-keys";
import { getProject, isProjectAdmin, updateProject } from "@/lib/projects";
import { ClientProjectJson, SharedProvider, StandardProvider, sharedProviders, standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ProjectUpdateOptions } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { KnownErrors } from "@stackframe/stack-shared";

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
      oauthProviders: yup.array(
        yup.object({
          id: yup.string().required(),
          enabled: yup.boolean().required(),
          type: yup.string().required(),
          clientId: yup.string().default(undefined),
          clientSecret: yup.string().default(undefined),
          tenantId: yup.string().default(undefined),
        })
      ).default(undefined),
      credentialEnabled: yup.boolean().default(undefined),
      magicLinkEnabled: yup.boolean().default(undefined),
      teamsEnabled: yup.boolean().oneOf([true]).default(undefined),
      allowLocalhost: yup.boolean().default(undefined),
    }).default(undefined),
  }).default(undefined),
});

const handler = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { apiKeyId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
      "x-stack-super-secret-admin-key": superSecretAdminKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    body,
  } = await deprecatedParseRequest(req, putOrGetSchema);  

  const { ...update } = body ?? {};

  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);
  const saValid = await checkApiKeySet(projectId, { superSecretAdminKey });

  const typedUpdate: ProjectUpdateOptions = {
    isProductionMode: update.isProductionMode,
    config: update.config && {
      domains: update.config.domains,
      allowLocalhost: update.config.allowLocalhost,
      credentialEnabled: update.config.credentialEnabled,
      magicLinkEnabled: update.config.magicLinkEnabled,
      teamsEnabled: update.config.teamsEnabled,
      oauthProviders: update.config.oauthProviders && update.config.oauthProviders.map((provider) => {
        if (sharedProviders.includes(provider.type as SharedProvider)) {
          return {
            id: provider.id,
            enabled: provider.enabled,
            type: provider.type as SharedProvider,
          };
        } else if (standardProviders.includes(provider.type as StandardProvider)) {
          if (!provider.clientId) {
            throw new StatusError(StatusError.BadRequest, "Missing clientId");
          }
          if (!provider.clientSecret) {
            throw new StatusError(StatusError.BadRequest, "Missing clientSecret");
          }
          
          return {
            id: provider.id,
            enabled: provider.enabled,
            type: provider.type as StandardProvider,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            tenantId: provider.tenantId,
          };
        } else {
          throw new StatusError(StatusError.BadRequest, "Invalid oauth provider type");
        }
      }),
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

    const project = await getProject(projectId);
    if (!project) {
      throw new Error("Project not found but the API key was valid? Something weird happened");
    }
    const clientProject: ClientProjectJson = {
      id: project.id,
      credentialEnabled: project.evaluatedConfig.credentialEnabled,
      magicLinkEnabled: project.evaluatedConfig.magicLinkEnabled,
      teamsEnabled: project.evaluatedConfig.teamsEnabled,
      oauthProviders: project.evaluatedConfig.oauthProviders.map(
        (provider) => ({
          id: provider.id,
          enabled: provider.enabled,
        }),
      ),
    };
 
    return NextResponse.json(clientProject);
  } else {
    throw new KnownErrors.ApiKeyNotFound();
  }
});
export const GET = handler;
export const PUT = handler;
export const POST = handler;
export const DELETE = handler;
