import { OauthProviderConfigJson, ProjectJson, ServerUserJson } from "stack-shared";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/prisma-client";
import { decodeAccessToken } from "./access-token";
import { getServerUser } from "./users";
import { generateUuid } from "stack-shared/dist/utils/uuids";
import { EmailConfigJson } from "stack-shared/dist/interface/clientInterface";

const fullProjectInclude = {
  config: {
    include: {
      oauthProviderConfigs: {
        include: {
          proxiedOauthConfig: true,
          standardOauthConfig: true,
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
} as const satisfies Prisma.ProjectInclude;
type FullProjectInclude = typeof fullProjectInclude;
type ProjectDB = Prisma.ProjectGetPayload<{ include: FullProjectInclude }> & {
  config: {
    oauthProviderConfigs: (Prisma.OauthProviderConfigGetPayload<
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
  projectOptions: Pick<ProjectJson, "displayName" | "description"> & Pick<ProjectJson['evaluatedConfig'], 'allowLocalhost'>
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
            allowLocalhost: projectOptions.allowLocalhost,
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
  options: {
    isProductionMode?: boolean,
    config?: {
      domains: {
        domain: string,
        handlerPath: string,
      }[],
    },
  }
): Promise<ProjectJson | null> {
  // TODO: Validate production mode consistency

  const transaction = [];

  if (options.config?.domains) {
    // Fetch current domains
    const currentDomains = await prismaClient.projectDomain.findMany({
      where: { projectConfigId: projectId },
    });

    const newDomains = options.config.domains;

    // Determine domains to be added or updated
    newDomains.forEach(domainConfig => {
      const existingDomain = currentDomains.find(d => d.domain === domainConfig.domain);
      if (existingDomain) {
        // Update existing domain
        transaction.push(prismaClient.projectDomain.update({
          where: { projectConfigId_domain: { projectConfigId: projectId, domain: domainConfig.domain } },
          data: { handlerPath: domainConfig.handlerPath },
        }));
      } else {
        // Create new domain
        transaction.push(prismaClient.projectDomain.create({
          data: {
            projectConfigId: projectId,
            domain: domainConfig.domain,
            handlerPath: domainConfig.handlerPath,
          },
        }));
      }
    });

    // Determine domains to be removed
    currentDomains.forEach(currentDomain => {
      if (!newDomains.some(domainConfig => domainConfig.domain === currentDomain.domain)) {
        // Delete domain not present in new list
        transaction.push(prismaClient.projectDomain.delete({
          where: { projectConfigId_domain: { projectConfigId: projectId, domain: currentDomain.domain } },
        }));
      }
    });
  }

  // Update project and run transaction
  const projectUpdatePromise = prismaClient.project.update({
    where: { id: projectId },
    data: {
      isProductionMode: options.isProductionMode,
      // Other updates can be applied here
    },
    include: fullProjectInclude, // Ensure you have defined this include object correctly elsewhere
  });

  transaction.push(projectUpdatePromise);

  const result = await prismaClient.$transaction(transaction);
  const updatedProject = result.pop(); // The last item is the updated project

  if (!updatedProject) {
    return null;
  }

  return projectJsonFromDbType(updatedProject); // Ensure this function is implemented correctly
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
    userCount: 0,
    isProductionMode: project.isProductionMode,
    evaluatedConfig: {
      id: project.config.id,
      allowLocalhost: project.config.allowLocalhost,
      domains: project.config.domains.map((domain) => ({
        domain: domain.domain,
        handlerPath: domain.handlerPath,
      })),
      oauthProviders: project.config.oauthProviderConfigs.flatMap((provider): OauthProviderConfigJson[] => {
        if (provider.proxiedOauthConfig) {
          return [{
            id: provider.id,
            type: ({
              "GITHUB": "shared-github",
              "GOOGLE": "shared-google",
              "TWITTER": "shared-twitter",
              "FACEBOOK": "shared-facebook",
              "LINKEDIN": "shared-linkedin",
              "SLACK": "shared-slack",
              "MICROSOFT": "shared-microsoft",
            } as const)[provider.proxiedOauthConfig.type],
          }];
        }
        if (provider.standardOauthConfig) {
          return [{
            id: provider.id,
            type: ({
              "GITHUB": "github",
              "FACEBOOK": "facebook",
              "SLACK": "slack",
              "TWITTER": "twitter",
              "LINKEDIN": "linkedin",
              "GOOGLE": "google",
              "MICROSOFT": "microsoft",
            } as const)[provider.standardOauthConfig.type],
            clientId: provider.standardOauthConfig.clientId,
            clientSecret: provider.standardOauthConfig.clientSecret,
            tenantId: provider.standardOauthConfig.tenantId || undefined,
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
