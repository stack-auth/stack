import { usersCrudHandlers } from "@/app/api/v1/users/crud";
import { prismaClient } from "@/prisma-client";
import { CrudHandlerInvocationError } from "@/route-handlers/crud-handler";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { ProviderType } from "@stackframe/stack-shared/dist/utils/oauth";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { fullPermissionInclude, teamPermissionDefinitionJsonFromDbType, teamPermissionDefinitionJsonFromTeamSystemDbType } from "./permissions";
import { decodeAccessToken } from "./tokens";

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
  prisma: Prisma.ProjectGetPayload<{ include: typeof fullProjectInclude }>
): ProjectsCrud["Admin"]["Read"] {
  const oauthProviders = prisma.config.oauthProviderConfigs
    .flatMap((provider): {
      id: ProviderType,
      enabled: boolean,
      type: 'standard' | 'shared',
      client_id?: string,
      client_secret?: string ,
      facebook_config_id?: string,
      microsoft_tenant_id?: string,
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
          facebook_config_id: provider.standardOAuthConfig.facebookConfigId ?? undefined,
          microsoft_tenant_id: provider.standardOAuthConfig.microsoftTenantId ?? undefined,
        }];
      } else {
        throw new StackAssertionError(`Exactly one of the provider configs should be set on provider config '${provider.id}' of project '${prisma.id}'`, { prisma });
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
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
      credential_enabled: prisma.config.credentialEnabled,
      magic_link_enabled: prisma.config.magicLinkEnabled,
      create_team_on_sign_up: prisma.config.createTeamOnSignUp,
      client_team_creation_enabled: prisma.config.clientTeamCreationEnabled,
      domains: prisma.config.domains
        .map((domain) => ({
          domain: domain.domain,
          handler_path: domain.handlerPath,
        }))
        .sort((a, b) => a.domain.localeCompare(b.domain)),
      oauth_providers: oauthProviders,
      enabled_oauth_providers: oauthProviders.filter(provider => provider.enabled),
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
        .map(teamPermissionDefinitionJsonFromDbType)
        .concat(prisma.config.teamCreateDefaultSystemPermissions.map(teamPermissionDefinitionJsonFromTeamSystemDbType))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(perm => ({ id: perm.id })),
      team_member_default_permissions: prisma.config.permissions.filter(perm => perm.isDefaultTeamMemberPermission)
        .map(teamPermissionDefinitionJsonFromDbType)
        .concat(prisma.config.teamMemberDefaultSystemPermissions.map(teamPermissionDefinitionJsonFromTeamSystemDbType))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(perm => ({ id: perm.id })),
    }
  };
}

export async function whyNotProjectAdmin(projectId: string, adminAccessToken: string): Promise<"unparsable-access-token" | "access-token-expired" | "wrong-token-project-id" | "not-admin" | null> {
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
    return "wrong-token-project-id";
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

  const project = await getProject(projectId);
  if (!project) {
    // this happens if the project is still in the user's managedProjectIds, but has since been deleted
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
