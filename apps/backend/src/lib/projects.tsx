import { usersCrudHandlers } from "@/app/api/v1/users/crud";
import { prismaClient } from "@/prisma-client";
import { CrudHandlerInvocationError } from "@/route-handlers/crud-handler";
import { Prisma, ProxiedOAuthProviderType, StandardOAuthProviderType } from "@prisma/client";
import { KnownErrors, OAuthProviderConfigJson, ProjectJson } from "@stackframe/stack-shared";
import { EmailConfigJson, SharedProvider, StandardProvider } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { StackAssertionError, captureError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { fullPermissionInclude, permissionDefinitionJsonFromDbType, permissionDefinitionJsonFromTeamSystemDbType } from "./permissions";
import { decodeAccessToken } from "./tokens";

function fromDBSharedProvider(type: ProxiedOAuthProviderType): SharedProvider {
  return ({
    "GITHUB": "shared-github",
    "GOOGLE": "shared-google",
    "FACEBOOK": "shared-facebook",
    "MICROSOFT": "shared-microsoft",
    "SPOTIFY": "shared-spotify",
  } as const)[type];
}

function fromDBStandardProvider(type: StandardOAuthProviderType): StandardProvider {
  return ({
    "GITHUB": "github",
    "FACEBOOK": "facebook",
    "GOOGLE": "google",
    "MICROSOFT": "microsoft",
    "SPOTIFY": "spotify",
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
      permissions: {
        include: fullPermissionInclude,
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
    permissions: Prisma.PermissionGetPayload<
      typeof fullProjectInclude.config.include.permissions
    >[],
  },
};

export function projectPrismaToCrud(
  prisma: Prisma.ProjectGetPayload<{ include: typeof fullProjectInclude }>,
  accessType: 'client' | 'server' | 'admin',
) {
  return {
    id: prisma.id,
    display_name: prisma.displayName,
    description: prisma.description ?? undefined,
    created_at_millis: prisma.createdAt.getTime(),
    user_count: prisma._count.users,
    is_production_mode: prisma.isProductionMode,
    config: {
      id: prisma.config.id,
      allow_localhost: prisma.config.allowLocalhost,
      credential_enabled: prisma.config.credentialEnabled,
      magic_link_enabled: prisma.config.magicLinkEnabled,
      create_team_on_sign_up: prisma.config.createTeamOnSignUp,
      domains: prisma.config.domains
        .map((domain) => ({
          domain: domain.domain,
          handler_path: domain.handlerPath,
        }))
        .sort((a, b) => a.domain.localeCompare(b.domain)),
      oauth_providers: prisma.config.oauthProviderConfigs
        .flatMap((provider): {
          id: Lowercase<ProxiedOAuthProviderType>,
          enabled: boolean,
          type: 'standard' | 'shared',
          client_id?: string | undefined,
          client_secret?: string ,
        }[] => {
          if (provider.proxiedOAuthConfig) {
            return [{
              id: typedToLowercase(provider.proxiedOAuthConfig.type),
              enabled: provider.enabled,
              type: 'shared',
            }];
          } else if (provider.standardOAuthConfig) {
            return [{
              id: typedToLowercase(provider.standardOAuthConfig.type),
              enabled: provider.enabled,
              type: 'standard',
              client_id: provider.standardOAuthConfig.clientId,
              client_secret: provider.standardOAuthConfig.clientSecret,
            }];
          } else {
            throw new StackAssertionError(`Exactly one of the provider configs should be set on provider config '${provider.id}' of project '${prisma.id}'`, { prisma });
          }
        })
        .filter(p => accessType === 'admin' ? true : p.enabled)
        .sort((a, b) => a.id.localeCompare(b.id)),
      email_config: (() => {
        const emailServiceConfig = prisma.config.emailServiceConfig;
        if (!emailServiceConfig) {
          throw new StackAssertionError(`Email service config should be set on project '${prisma.id}'`, { prisma });
        }
        if (emailServiceConfig.proxiedEmailServiceConfig) {
          return {
            type: "shared"
          } as const;
        } else if (emailServiceConfig.standardEmailServiceConfig) {
          const standardEmailConfig = emailServiceConfig.standardEmailServiceConfig;
          return {
            type: "standard",
            host: standardEmailConfig.host,
            port: standardEmailConfig.port,
            username: standardEmailConfig.username,
            password: standardEmailConfig.password,
            sender_email: standardEmailConfig.senderEmail,
            sender_name: standardEmailConfig.senderName,
          } as const;
        } else {
          throw new StackAssertionError(`Exactly one of the email service configs should be set on project '${prisma.id}'`, { prisma });
        }
      })(),
      team_creator_default_permissions: prisma.config.permissions.filter(perm => perm.isDefaultTeamCreatorPermission)
        .map(permissionDefinitionJsonFromDbType)
        .concat(prisma.config.teamCreateDefaultSystemPermissions.map(permissionDefinitionJsonFromTeamSystemDbType))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(perm => ({ id: perm.id })),
      team_member_default_permissions: prisma.config.permissions.filter(perm => perm.isDefaultTeamMemberPermission)
        .map(permissionDefinitionJsonFromDbType)
        .concat(prisma.config.teamMemberDefaultSystemPermissions.map(permissionDefinitionJsonFromTeamSystemDbType))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(perm => ({ id: perm.id })),
    }
  };
}

export async function whyNotProjectAdmin(projectId: string, adminAccessToken: string): Promise<"unparsable-access-token" | "access-token-expired" | "wrong-project-id" | "not-admin" | null> {
  if (!adminAccessToken) {
    return "unparsable-access-token";
  }

  let decoded;
  try {
    decoded = await decodeAccessToken(adminAccessToken);
  } catch (error) {
    if (error instanceof KnownErrors.AccessTokenExpired) {
      return "access-token-expired";
    }
    console.warn("Failed to decode a user-provided admin access token. This may not be an error (for example, it could happen if the client changed Stack app hosts), but could indicate one.", error);
    return "unparsable-access-token";
  }
  const { userId, projectId: accessTokenProjectId } = decoded;
  if (accessTokenProjectId !== "internal") {
    return "wrong-project-id";
  }

  let user;
  try {
    user = await usersCrudHandlers.adminRead({
      project: await getProject("internal") ?? throwErr("Can't find internal project??"),
      user_id: userId,
    });
  } catch (e) {
    if (e instanceof CrudHandlerInvocationError && e.cause instanceof KnownErrors.UserNotFound) {
      // this may happen eg. if the user has a valid access token but has since been deleted
      return "not-admin";
    }
    throw e;
  }

  const allProjects = listManagedProjectIds(user);
  if (!allProjects.includes(projectId)) {
    return "not-admin";
  }

  return null;
}

export async function isProjectAdmin(projectId: string, adminAccessToken: string) {
  return !await whyNotProjectAdmin(projectId, adminAccessToken);
}

function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string");
}

export function listManagedProjectIds(projectUser: UsersCrud["Admin"]["Read"]) {
  const serverMetadata = projectUser.server_metadata;
  if (typeof serverMetadata !== "object" || !(!serverMetadata || "managedProjectIds" in serverMetadata)) {
    throw new StackAssertionError("Invalid server metadata, did something go wrong?", { serverMetadata });
  }
  const managedProjectIds = serverMetadata?.managedProjectIds ?? [];
  if (!isStringArray(managedProjectIds)) {
    throw new StackAssertionError("Invalid server metadata, did something go wrong? Expected string array", { managedProjectIds });
  }

  return managedProjectIds;
}

export async function getProject(projectId: string): Promise<ProjectJson | null> {
  const rawProject = await prismaClient.project.findUnique({
    where: { id: projectId },
    include: fullProjectInclude,
  });

  if (!rawProject) {
    return null;
  }

  return projectJsonFromDbType(rawProject);
}

export function projectJsonFromDbType(project: ProjectDB): ProjectJson {
  let emailConfig: EmailConfigJson | undefined;
  const emailServiceConfig = project.config.emailServiceConfig;
  if (emailServiceConfig) {
    if (emailServiceConfig.proxiedEmailServiceConfig) {
      emailConfig = {
        type: "shared",
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
        senderName: standardEmailConfig.senderName,
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
          }];
        }
        captureError("projectJsonFromDbType", new StackAssertionError(`Exactly one of the provider configs should be set on provider config '${provider.id}' of project '${project.id}'. Ignoring it`, { project }));
        return [];
      }),
      emailConfig,
      teamCreatorDefaultPermissions: project.config.permissions.filter(perm => perm.isDefaultTeamCreatorPermission)
        .map(permissionDefinitionJsonFromDbType)
        .concat(project.config.teamCreateDefaultSystemPermissions.map(permissionDefinitionJsonFromTeamSystemDbType)),
      teamMemberDefaultPermissions: project.config.permissions.filter(perm => perm.isDefaultTeamMemberPermission)
        .map(permissionDefinitionJsonFromDbType)
        .concat(project.config.teamMemberDefaultSystemPermissions.map(permissionDefinitionJsonFromTeamSystemDbType)),
    },
  };
}

