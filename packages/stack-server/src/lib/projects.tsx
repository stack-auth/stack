import { OAuthProviderConfigJson, ProjectJson, ServerUserJson } from "@stackframe/stack-shared";
import { Prisma, ProxiedOAuthProviderType, StandardOAuthProviderType } from "@prisma/client";
import { prismaClient } from "@/prisma-client";
import { decodeAccessToken } from "./access-token";
import { getServerUser } from "./users";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { EmailConfigJson, SharedProvider, StandardProvider, sharedProviders, standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { OAuthProviderUpdateOptions, ProjectUpdateOptions } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";


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


const fullProjectInclude = {
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
type ProjectDB = Prisma.ProjectGetPayload<{ include: FullProjectInclude }> & {
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

export async function isProjectAdmin(projectId: string, adminAccessToken: string) {
  let decoded;
  try { 
    decoded = await decodeAccessToken(adminAccessToken);
  } catch (error) {
    return false;
  }
  const { userId, projectId: accessTokenProjectId } = decoded;
  if (accessTokenProjectId !== "internal") {
    return false;
  }

  const projectUser = await getServerUser("internal", userId);
  if (!projectUser) {
    return false;
  }

  const allProjects = listProjectIds(projectUser);
  return allProjects.includes(projectId);
}

function listProjectIds(projectUser: ServerUserJson) {
  const serverMetadata = projectUser.serverMetadata;
  if (typeof serverMetadata !== "object" || !(!serverMetadata || "managedProjectIds" in serverMetadata)) {
    throw new Error("Invalid server metadata, did something go wrong?");
  }
  const managedProjectIds = serverMetadata?.managedProjectIds ?? [];
  if (!isStringArray(managedProjectIds)) {
    throw new Error("Invalid server metadata, did something go wrong? Expected string array");
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
  projectOptions: Pick<ProjectJson, "displayName" | "description">
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
            allowLocalhost: true,
            credentialEnabled: true,
            oauthProviderConfigs: {
              create: (['github', 'google'] as const).map((id) => ({
                id,
                proxiedOAuthConfig: {
                  create: {                
                    type: typedToUppercase(id),
                  }
                },
                projectUserOAuthAccounts: {
                  create: []
                },
              })),
            },
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

  return projectJsonFromDbType(project);
}

export async function getProject(projectId: string): Promise<ProjectJson | null> {
  return await updateProject(projectId, {});
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

  const oauthProvidersUpdate = options.config?.oauthProviders;
  if (oauthProvidersUpdate) {
    const oldProviders = project.config.oauthProviderConfigs;
    const providerMap = new Map(oldProviders.map((provider) => [
      provider.id, 
      {
        providerUpdate: oauthProvidersUpdate.find((p) => p.id === provider.id) ?? throwErr(`Missing provider update for provider '${provider.id}'`),
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
        console.error(`Invalid provider type '${providerUpdate.type}'`);
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
        console.error(`Invalid provider type '${provider.update.type}'`);
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
  }

  // Update credentialEnabled
  if (options.config?.credentialEnabled !== undefined) {
    transaction.push(prismaClient.projectConfig.update({
      where: { id: project.config.id },
      data: { credentialEnabled: options.config.credentialEnabled },
    }));
  }

  // Update allowLocalhost
  if (options.config?.allowLocalhost !== undefined) {
    transaction.push(prismaClient.projectConfig.update({
      where: { id: project.config.id },
      data: { allowLocalhost: options.config.allowLocalhost },
    }));
  }

  if (options.isProductionMode !== undefined) {
    // Update production mode
    transaction.push(prismaClient.project.update({
      where: { id: projectId },
      data: { isProductionMode: options.isProductionMode },
    }));
  }

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

function projectJsonFromDbType(project: ProjectDB): ProjectJson {
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
        console.error(`Exactly one of the provider configs should be set on provider config '${provider.id}' of project '${project.id}'. Ignoring it`, { project });
        return [];
      }),
      emailConfig,
    },
  };
}

function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string");
}
