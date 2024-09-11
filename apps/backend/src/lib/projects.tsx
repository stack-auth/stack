import { prismaClient } from "@/prisma-client";
import { Prisma } from "@prisma/client";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { fullPermissionInclude, teamPermissionDefinitionJsonFromDbType, teamPermissionDefinitionJsonFromTeamSystemDbType } from "./permissions";

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
      authMethodConfigs: {
        include: {
          oauthProviderConfig: {
            include: {
              proxiedOAuthConfig: true,
              standardOAuthConfig: true,
            },
          },
          otpConfig: true,
          passwordConfig: true,
        }
      },
      connectedAccountConfigs: {
        include: {
          oauthProviderConfig: {
            include: {
              proxiedOAuthConfig: true,
              standardOAuthConfig: true,
            },
          },
        }
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

export type ProjectDB = Prisma.ProjectGetPayload<{ include: typeof fullProjectInclude }> & {
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
  prisma: Prisma.ProjectGetPayload<{ include: typeof fullProjectInclude }>
): ProjectsCrud["Admin"]["Read"] {
  /* @deprecated */
  const enabledOauthProviders = prisma.config.authMethodConfigs
    .map((config) => {
      if (config.oauthProviderConfig) {
        const providerConfig = config.oauthProviderConfig;
        if (providerConfig.proxiedOAuthConfig) {
          return {
            id: typedToLowercase(providerConfig.proxiedOAuthConfig.type),
            enabled: config.enabled,
            type: "shared",
          } as const;
        } else if (providerConfig.standardOAuthConfig) {
          return {
            id: typedToLowercase(providerConfig.standardOAuthConfig.type),
            enabled: config.enabled,
            type: "standard",
            client_id: providerConfig.standardOAuthConfig.clientId,
            client_secret: providerConfig.standardOAuthConfig.clientSecret,
            facebook_config_id: providerConfig.standardOAuthConfig.facebookConfigId ?? undefined,
            microsoft_tenant_id: providerConfig.standardOAuthConfig.microsoftTenantId ?? undefined,
          } as const;
        } else {
          throw new StackAssertionError(`DB union violation: provider config '${config.id}' of project '${prisma.id}' is neither proxied nor standard`, { prisma });
        }
      }
    })
    .filter((provider): provider is Exclude<typeof provider, undefined> => !!provider)
    .filter(provider => provider.enabled)
    .sort((a, b) => a.id.localeCompare(b.id));

  const oauthProviderConfigs = prisma.config.oauthProviderConfigs.map(provider => {
    if (provider.proxiedOAuthConfig) {
      return {
        id: provider.id,
        shared: true,
        type: typedToLowercase(provider.proxiedOAuthConfig.type),
      } as const;
    } else if (provider.standardOAuthConfig) {
      return {
        id: provider.id,
        shared: false,
        type: typedToLowercase(provider.standardOAuthConfig.type),
        client_id: provider.standardOAuthConfig.clientId,
        client_secret: provider.standardOAuthConfig.clientSecret,
        facebook_config_id: provider.standardOAuthConfig.facebookConfigId ?? undefined,
        microsoft_tenant_id: provider.standardOAuthConfig.microsoftTenantId ?? undefined,
      } as const;
    } else {
      throw new StackAssertionError(`DB union violation: provider config '${provider.id}' of project '${prisma.id}' is neither proxied nor standard`, { prisma });
    }
  });

  const authMethodConfigs = prisma.config.authMethodConfigs.map(config => {
    if (config.passwordConfig) {
      return {
        id: config.id,
        enabled: config.enabled,
        type: "password",
      } as const;
    } else if (config.otpConfig) {
      return {
        id: config.id,
        enabled: config.enabled,
        type: "otp",
      } as const;
    } else if (config.oauthProviderConfig) {
      return {
        id: config.id,
        type: "oauth",
        enabled: config.enabled,
        provider_config_id: config.oauthProviderConfig.id,
      } as const;
    }
    throw new StackAssertionError(`DB union violation: auth method config '${config.id}' of project '${prisma.id}' is neither password nor otp`, { prisma });
  });

  const connectedAccountConfigs = prisma.config.connectedAccountConfigs.map(config => {
    if (!config.oauthProviderConfig) {
      throw new StackAssertionError(`DB non-nullable violation: connected account config '${config.id}' of project '${prisma.id}' is not connected to an oauth provider`, { prisma });
    }
    return {
      id: config.id,
      enabled: config.enabled,
      provider_id: config.oauthProviderConfig.id,
    } as const;
  });

  const emailConfig = (() => {
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
      throw new StackAssertionError(`DB union violation: email service config '${prisma.id}' of project '${prisma.id}' is neither proxied nor standard`, { prisma });
    }
  })();

  const domains = prisma.config.domains
    .map((domain) => ({
      domain: domain.domain,
      handler_path: domain.handlerPath,
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));

  const getPermissions = (type: 'creator' | 'member') => {
    return prisma.config.permissions.filter(perm => type === 'creator' ? perm.isDefaultTeamCreatorPermission : perm.isDefaultTeamMemberPermission)
      .map(teamPermissionDefinitionJsonFromDbType)
      .concat((type === 'creator' ? prisma.config.teamCreateDefaultSystemPermissions : prisma.config.teamMemberDefaultSystemPermissions ).map(teamPermissionDefinitionJsonFromTeamSystemDbType))
      .map(perm => ({ id: perm.id }))
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  const passwordAuth = prisma.config.authMethodConfigs.find((config) => config.passwordConfig && config.enabled);
  const otpAuth = prisma.config.authMethodConfigs.find((config) => config.otpConfig && config.enabled);

  return {
    id: prisma.id,
    display_name: prisma.displayName,
    description: prisma.description ?? "",
    created_at_millis: prisma.createdAt.getTime(),
    user_count: prisma._count.users,
    is_production_mode: prisma.isProductionMode,
    config: {
      id: prisma.config.id,
      allow_localhost: prisma.config.allowLocalhost,
      sign_up_enabled: prisma.config.signUpEnabled,
      create_team_on_sign_up: prisma.config.createTeamOnSignUp,
      client_team_creation_enabled: prisma.config.clientTeamCreationEnabled,
      team_creator_default_permissions: getPermissions('creator'),
      team_member_default_permissions: getPermissions('member'),
      domains: domains,
      email_config: emailConfig,
      oauth_provider_configs: oauthProviderConfigs,
      auth_method_configs: authMethodConfigs,
      connected_accounts: connectedAccountConfigs,

      /* @deprecated */
      enabled_oauth_providers: enabledOauthProviders,
      /* @deprecated */
      credential_enabled: !!passwordAuth,
      /* @deprecated */
      magic_link_enabled: !!otpAuth,
    }
  };
}

function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string");
}

export function listManagedProjectIds(projectUser: UsersCrud["Admin"]["Read"]) {
  const serverMetadata = projectUser.server_metadata;
  if (typeof serverMetadata !== "object") {
    throw new StackAssertionError("Invalid server metadata, did something go wrong?", { serverMetadata });
  }
  const managedProjectIds = (serverMetadata as any)?.managedProjectIds ?? [];
  if (!isStringArray(managedProjectIds)) {
    throw new StackAssertionError("Invalid server metadata, did something go wrong? Expected string array", { managedProjectIds });
  }

  return managedProjectIds;
}

export async function getProject(projectId: string): Promise<ProjectsCrud["Admin"]["Read"] | null> {
  const rawProject = await prismaClient.project.findUnique({
    where: { id: projectId },
    include: fullProjectInclude,
  });

  if (!rawProject) {
    return null;
  }

  return projectPrismaToCrud(rawProject);
}
