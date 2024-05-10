import * as yup from "yup";
import { KnownErrors, OAuthProviderConfigJson, ProjectJson, ServerUserJson } from "@stackframe/stack-shared";
import { Prisma, ProxiedOAuthProviderType, StandardOAuthProviderType } from "@prisma/client";
import { prismaClient } from "@/prisma-client";
import { decodeAccessToken } from "./tokens";
import { getServerUser } from "./users";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { EmailConfigJson, SharedProvider, StandardProvider, sharedProviders, standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { OAuthProviderUpdateOptions, ProjectUpdateOptions } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { StackAssertionError, StatusError, captureError, throwStackErr } from "@stackframe/stack-shared/dist/utils/errors";


function toDBSharedProvider(type: SharedProvider): ProxiedOAuthProviderType {
  return ({
    "shared-github": "GITHUB",
    "shared-google": "GOOGLE",
    "shared-facebook": "FACEBOOK",
    "shared-microsoft": "MICROSOFT",
  } as const)[type];
}

function toDBStandardProvider(type: StandardProvider): StandardOAuthProviderType {
  return ({
    "github": "GITHUB",
    "facebook": "FACEBOOK",
    "google": "GOOGLE",
    "microsoft": "MICROSOFT",
  } as const)[type];
}

function fromDBSharedProvider(type: ProxiedOAuthProviderType): SharedProvider {
  return ({
    "GITHUB": "shared-github",
    "GOOGLE": "shared-google",
    "FACEBOOK": "shared-facebook",
    "MICROSOFT": "shared-microsoft",
  } as const)[type];
}

function fromDBStandardProvider(type: StandardOAuthProviderType): StandardProvider {
  return ({
    "GITHUB": "github",
    "FACEBOOK": "facebook",
    "GOOGLE": "google",
    "MICROSOFT": "microsoft",
  } as const)[type];
}


export const fullProjectInclude = {
  config: {
    include: {
      oauthProviderConfigs: {
        include: {
          proxiedOAuthConfig: true,
          standardOAuthConfig: true,
        },
      },
      emailServiceConfig: {
        include: {
          proxiedEmailServiceConfig: true,
          standardEmailServiceConfig: true,
        },
      },
      domains: true,
    },
  },
  configOverride: true,
  _count: {
    select: {
      users: true, // Count the users related to the project
    },
  },
} as const satisfies Prisma.ProjectInclude;
type FullProjectInclude = typeof fullProjectInclude;
export type ProjectDB = Prisma.ProjectGetPayload<{ include: FullProjectInclude }> & {
  config: {
    oauthProviderConfigs: (Prisma.OAuthProviderConfigGetPayload<
      typeof fullProjectInclude.config.include.oauthProviderConfigs
    >)[],
    emailServiceConfig: Prisma.EmailServiceConfigGetPayload<
      typeof fullProjectInclude.config.include.emailServiceConfig
    > | null,
    domains: Prisma.ProjectDomainGetPayload<
      typeof fullProjectInclude.config.include.domains
    >[],
  },
};

export async function whyNotProjectAdmin(projectId: string, adminAccessToken: string): Promise<"unparsable-access-token" | "access-token-expired" | "wrong-project-id" | "not-admin" | null> {
  let decoded;
  try {
    decoded = await decodeAccessToken(adminAccessToken);
  } catch (error) {
    if (error instanceof KnownErrors.AccessTokenExpired) {
      return "access-token-expired";
    }
    return "unparsable-access-token";
  }
  const { userId, projectId: accessTokenProjectId } = decoded;
  if (accessTokenProjectId !== "internal") {
    return "wrong-project-id";
  }

  const projectUser = await getServerUser("internal", userId);
  if (!projectUser) {
    return "not-admin";
  }

  const allProjects = listProjectIds(projectUser);
  if (!allProjects.includes(projectId)) {
    return "not-admin";
  }

  return null;
}

export async function isProjectAdmin(projectId: string, adminAccessToken: string) {
  return !await whyNotProjectAdmin(projectId, adminAccessToken);
}

function listProjectIds(projectUser: ServerUserJson) {
  const serverMetadata = projectUser.serverMetadata;
  if (typeof serverMetadata !== "object" || !(!serverMetadata || "managedProjectIds" in serverMetadata)) {
    throw new StackAssertionError("Invalid server metadata, did something go wrong?", { serverMetadata });
  }
  const managedProjectIds = serverMetadata?.managedProjectIds ?? [];
  if (!isStringArray(managedProjectIds)) {
    throw new StackAssertionError("Invalid server metadata, did something go wrong? Expected string array", { managedProjectIds });
  }

  return managedProjectIds;
}

export async function listProjects(projectUser: ServerUserJson): Promise<ProjectJson[]> {
  const managedProjectIds = listProjectIds(projectUser);

  const projects = await prismaClient.project.findMany({
    where: {
      id: {
        in: managedProjectIds,
      },
    },
    include: fullProjectInclude,
  });

  return projects.map(p => projectJsonFromDbType(p));
}

export async function createProject(
  projectUser: ServerUserJson,
  projectOptions: ProjectUpdateOptions & { displayName: string },
): Promise<ProjectJson> {
  if (projectUser.projectId !== "internal") {
    throw new Error("Only internal project users can create projects");
  }

  const project = await prismaClient.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        id: generateUuid(),
        isProductionMode: false,
        displayName: projectOptions.displayName,
        description: projectOptions.description,
        config: {
          create: {
            allowLocalhost: projectOptions.config?.allowLocalhost ?? true,
            credentialEnabled: !!projectOptions.config?.credentialEnabled,
            magicLinkEnabled: !!projectOptions.config?.magicLinkEnabled,
            createTeamOnSignUp: !!projectOptions.config?.createTeamOnSignUp,
            emailServiceConfig: {
              create: {
                senderName: projectOptions.displayName,
                proxiedEmailServiceConfig: {
                  create: {}
                }
              }
            },
          },
        },
      },
      include: fullProjectInclude,
    });

    const projectUserTx = await tx.projectUser.findUniqueOrThrow({
      where: {
        projectId_projectUserId: {
          projectId: "internal",
          projectUserId: projectUser.id,
        },
      },
    });

    const serverMetadataTx: any = projectUserTx?.serverMetadata ?? {};

    await tx.projectUser.update({
      where: {
        projectId_projectUserId: {
          projectId: "internal",
          projectUserId: projectUserTx.projectUserId,
        },
      },
      data: {
        serverMetadata: {
          ...serverMetadataTx ?? {},
          managedProjectIds: [
            ...serverMetadataTx?.managedProjectIds ?? [],
            project.id,
          ],
        },
      },
    });

    return project;
  });

  const updatedProject = await updateProject(project.id, projectOptions);

  if (!updatedProject) {
    throw new Error("Failed to update project after creation");
  }

  return updatedProject;
}

export async function getProject(projectId: string): Promise<ProjectJson | null> {
  return await updateProject(projectId, {});
}

async function _createOauthUpdateTransactions(
  projectId: string,
  options: ProjectUpdateOptions
) {
  const project = await prismaClient.project.findUnique({
    where: { id: projectId },
    include: fullProjectInclude,
  });

  if (!project) {
    throw new Error(`Project with id '${projectId}' not found`);
  }

  const transaction = [];
  const oauthProvidersUpdate = options.config?.oauthProviders;
  if (!oauthProvidersUpdate) {
    return [];
  }
  const oldProviders = project.config.oauthProviderConfigs;
  const providerMap = new Map(oldProviders.map((provider) => [
    provider.id, 
    {
      providerUpdate: oauthProvidersUpdate.find((p) => p.id === provider.id) ?? throwStackErr(`Missing provider update for provider '${provider.id}'`),
      oldProvider: provider,
    }
  ]));

  const newProviders = oauthProvidersUpdate.map((providerUpdate) => ({
    id: providerUpdate.id, 
    update: providerUpdate
  })).filter(({ id }) => !providerMap.has(id));

  // Update existing proxied/standard providers
  for (const [id, { providerUpdate, oldProvider }] of providerMap) {
    // remove existing provider configs
    if (oldProvider.proxiedOAuthConfig) {
      transaction.push(prismaClient.proxiedOAuthProviderConfig.delete({
        where: { projectConfigId_id: { projectConfigId: project.config.id, id } },
      }));
    }

    if (oldProvider.standardOAuthConfig) {
      transaction.push(prismaClient.standardOAuthProviderConfig.delete({
        where: { projectConfigId_id: { projectConfigId: project.config.id, id } },
      }));
    }

    // update provider configs with newly created proxied/standard provider configs
    let providerConfigUpdate;
    if (sharedProviders.includes(providerUpdate.type as SharedProvider)) {
      providerConfigUpdate = {
        proxiedOAuthConfig: {
          create: {
            type: toDBSharedProvider(providerUpdate.type as SharedProvider),
          },
        },
      };

    } else if (standardProviders.includes(providerUpdate.type as StandardProvider)) {
      const typedProviderConfig = providerUpdate as OAuthProviderUpdateOptions & { type: StandardProvider };

      providerConfigUpdate = {
        standardOAuthConfig: {
          create: {
            type: toDBStandardProvider(providerUpdate.type as StandardProvider),
            clientId: typedProviderConfig.clientId,
            clientSecret: typedProviderConfig.clientSecret,
            tenantId: typedProviderConfig.tenantId,
          },
        },
      };
    } else {
      throw new StackAssertionError(`Invalid provider type '${providerUpdate.type}'`, { providerUpdate });
    }

    transaction.push(prismaClient.oAuthProviderConfig.update({
      where: { projectConfigId_id: { projectConfigId: project.config.id, id } },
      data: {
        enabled: providerUpdate.enabled,
        ...providerConfigUpdate,
      },
    }));
  }
    
  // Create new providers
  for (const provider of newProviders) {
    let providerConfigData;
    if (sharedProviders.includes(provider.update.type as SharedProvider)) {
      providerConfigData = {
        proxiedOAuthConfig: {
          create: {
            type: toDBSharedProvider(provider.update.type as SharedProvider),
          },
        },
      };
    } else if (standardProviders.includes(provider.update.type as StandardProvider)) {
      const typedProviderConfig = provider.update as OAuthProviderUpdateOptions & { type: StandardProvider };

      providerConfigData = {
        standardOAuthConfig: {
          create: {
            type: toDBStandardProvider(provider.update.type as StandardProvider),
            clientId: typedProviderConfig.clientId,
            clientSecret: typedProviderConfig.clientSecret,
            tenantId: typedProviderConfig.tenantId,
          },
        },
      };
    } else {
      throw new StackAssertionError(`Invalid provider type '${provider.update.type}'`, { provider });
    }

    transaction.push(prismaClient.oAuthProviderConfig.create({
      data: {
        id: provider.id,
        projectConfigId: project.config.id,
        enabled: provider.update.enabled,
        ...providerConfigData,
      },
    }));
  }
  return transaction;
}

export async function updateProject(
  projectId: string,
  options: ProjectUpdateOptions,
): Promise<ProjectJson | null> {
  // TODO: Validate production mode consistency
  const transaction = [];

  const project = await prismaClient.project.findUnique({
    where: { id: projectId },
    include: fullProjectInclude,
  });

  if (!project) {
    return null;
  }

  if (options.config?.domains) {
    const newDomains = options.config.domains;

    // delete existing domains
    transaction.push(prismaClient.projectDomain.deleteMany({
      where: { projectConfigId: project.config.id },
    }));

    // create new domains
    newDomains.forEach(domainConfig => {
      transaction.push(prismaClient.projectDomain.create({
        data: {
          projectConfigId: project.config.id,
          domain: domainConfig.domain,
          handlerPath: domainConfig.handlerPath,
        },
      }));
    });
  }

  transaction.push(...(await _createOauthUpdateTransactions(projectId, options)));

  transaction.push(prismaClient.projectConfig.update({
    where: { id: project.config.id },
    data: { 
      credentialEnabled: options.config?.credentialEnabled,
      magicLinkEnabled: options.config?.magicLinkEnabled,
      allowLocalhost: options.config?.allowLocalhost,
      createTeamOnSignUp: options.config?.createTeamOnSignUp,
    },
  }));
  
  transaction.push(prismaClient.project.update({
    where: { id: projectId },
    data: { 
      displayName: options.displayName,
      description: options.description,
      isProductionMode: options.isProductionMode 
    },
  }));

  await prismaClient.$transaction(transaction);
  
  const updatedProject = await prismaClient.project.findUnique({
    where: { id: projectId },
    include: fullProjectInclude, // Ensure you have defined this include object correctly elsewhere
  });

  if (!updatedProject) {
    return null;
  }

  return projectJsonFromDbType(updatedProject);
}

export function projectJsonFromDbType(project: ProjectDB): ProjectJson {
  let emailConfig: EmailConfigJson | undefined;
  const emailServiceConfig = project.config.emailServiceConfig;
  if (emailServiceConfig) {
    if (emailServiceConfig.proxiedEmailServiceConfig) {
      emailConfig = {
        type: "shared",
        senderName: emailServiceConfig.senderName,
      };
    }
    if (emailServiceConfig.standardEmailServiceConfig) {
      const standardEmailConfig = emailServiceConfig.standardEmailServiceConfig;
      emailConfig = {
        type: "standard",
        host: standardEmailConfig.host,
        port: standardEmailConfig.port,
        username: standardEmailConfig.username,
        password: standardEmailConfig.password,
        senderEmail: standardEmailConfig.senderEmail,
        senderName: emailServiceConfig.senderName,
      };
    }
  }
  return {
    id: project.id,
    displayName: project.displayName,
    description: project.description ?? undefined,
    createdAtMillis: project.createdAt.getTime(),
    userCount: project._count.users,
    isProductionMode: project.isProductionMode,
    evaluatedConfig: {
      id: project.config.id,
      allowLocalhost: project.config.allowLocalhost,
      credentialEnabled: project.config.credentialEnabled,
      magicLinkEnabled: project.config.magicLinkEnabled,
      createTeamOnSignUp: project.config.createTeamOnSignUp,
      domains: project.config.domains.map((domain) => ({
        domain: domain.domain,
        handlerPath: domain.handlerPath,
      })),
      oauthProviders: project.config.oauthProviderConfigs.flatMap((provider): OAuthProviderConfigJson[] => {
        if (provider.proxiedOAuthConfig) {
          return [{
            id: provider.id,
            enabled: provider.enabled,
            type: fromDBSharedProvider(provider.proxiedOAuthConfig.type),
          }];
        }
        if (provider.standardOAuthConfig) {
          return [{
            id: provider.id,
            enabled: provider.enabled,
            type: fromDBStandardProvider(provider.standardOAuthConfig.type),
            clientId: provider.standardOAuthConfig.clientId,
            clientSecret: provider.standardOAuthConfig.clientSecret,
            tenantId: provider.standardOAuthConfig.tenantId || undefined,
          }];
        }
        captureError("projectJsonFromDbType", new StackAssertionError(`Exactly one of the provider configs should be set on provider config '${provider.id}' of project '${project.id}'. Ignoring it`, { project }));
        return [];
      }),
      emailConfig,
    },
  };
}

function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string");
}

const nonRequiredSchemas = {
  description: yup.string().default(undefined),
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
    allowLocalhost: yup.boolean().default(undefined),
    createTeamOnSignUp: yup.boolean().default(undefined),
  }).default(undefined),
};

export const getProjectUpdateSchema = () => yup.object({
  displayName: yup.string().default(undefined),
  ...nonRequiredSchemas,
});

export const getProjectCreateSchema = () => yup.object({
  displayName: yup.string().required(),
  ...nonRequiredSchemas,
});

export const projectSchemaToUpdateOptions = (
  update: yup.InferType<ReturnType<typeof getProjectUpdateSchema>>
): ProjectUpdateOptions => {
  return {
    displayName: update.displayName,
    description: update.description,
    isProductionMode: update.isProductionMode,
    config: update.config && {
      domains: update.config.domains,
      allowLocalhost: update.config.allowLocalhost,
      credentialEnabled: update.config.credentialEnabled,
      magicLinkEnabled: update.config.magicLinkEnabled,
      createTeamOnSignUp: update.config.createTeamOnSignUp,
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
};

export const projectSchemaToCreateOptions = (
  create: yup.InferType<ReturnType<typeof getProjectCreateSchema>>
): ProjectUpdateOptions & { displayName: string } => {
  return {
    ...projectSchemaToUpdateOptions(create),
    displayName: create.displayName,
  };
};