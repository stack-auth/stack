import * as yup from "yup";
import { KnownErrors, OAuthProviderConfigJson, ProjectJson, ServerUserJson } from "@stackframe/stack-shared";
import { Prisma, ProxiedOAuthProviderType, StandardOAuthProviderType } from "@prisma/client";
import { prismaClient } from "@/prisma-client";
import { decodeAccessToken } from "./tokens";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { EmailConfigJson, SharedProvider, StandardProvider, sharedProviders, standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { OAuthProviderUpdateOptions, ProjectUpdateOptions } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { StackAssertionError, StatusError, captureError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { fullPermissionInclude, isTeamSystemPermission, listServerPermissionDefinitions, serverPermissionDefinitionJsonFromDbType, serverPermissionDefinitionJsonFromTeamSystemDbType, teamPermissionIdSchema, teamSystemPermissionStringToDBType } from "./permissions";
import { usersCrudHandlers } from "@/app/api/v1/users/crud";
import { CrudHandlerInvocationError } from "@/route-handlers/crud-handler";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";

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
      userId,
    });
  } catch (e) {
    if (e instanceof CrudHandlerInvocationError && e.cause instanceof KnownErrors.UserNotFound) {
      // this may happen eg. if the user has a valid access token but has since been deleted
      return "not-admin";
    }
    throw e;
  }

  const allProjects = listProjectIds(user);
  if (!allProjects.includes(projectId)) {
    return "not-admin";
  }

  return null;
}

export async function isProjectAdmin(projectId: string, adminAccessToken: string) {
  return !await whyNotProjectAdmin(projectId, adminAccessToken);
}

function listProjectIds(projectUser: UsersCrud["Admin"]["Read"]) {
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

export async function listProjects(projectUser: UsersCrud["Admin"]["Read"]): Promise<ProjectJson[]> {
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
        .map(serverPermissionDefinitionJsonFromDbType)
        .concat(project.config.teamCreateDefaultSystemPermissions.map(serverPermissionDefinitionJsonFromTeamSystemDbType)),
      teamMemberDefaultPermissions: project.config.permissions.filter(perm => perm.isDefaultTeamMemberPermission)
        .map(serverPermissionDefinitionJsonFromDbType)
        .concat(project.config.teamMemberDefaultSystemPermissions.map(serverPermissionDefinitionJsonFromTeamSystemDbType)),
    },
  };
}

function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string");
}

function yupRequiredWhenShared<S extends yup.AnyObject>(schema: S): S {
  return schema.when('shared', {
    is: 'false',
    then: (schema: S) => schema.required(),
    otherwise: (schema: S) => schema.optional()
  });
}

const nonRequiredSchemas = {
  description: yupString().optional(),
  isProductionMode: yupBoolean().optional(),
  config: yupObject({
    domains: yupArray(yupObject({
      domain: yupString().required(),
      handlerPath: yupString().required(),
    })).optional().default(undefined),
    oauthProviders: yupArray(
      yupObject({
        id: yupString().required(),
        enabled: yupBoolean().required(),
        type: yupString().required(),
        clientId: yupString().optional(),
        clientSecret: yupString().optional(),
      })
    ).optional().default(undefined),
    credentialEnabled: yupBoolean().optional(),
    magicLinkEnabled: yupBoolean().optional(),
    allowLocalhost: yupBoolean().optional(),
    createTeamOnSignUp: yupBoolean().optional(),
    emailConfig: yupObject({
      type: yupString().oneOf(["shared", "standard"]).required(),
      senderName: yupRequiredWhenShared(yupString()),
      host: yupRequiredWhenShared(yupString()),
      port: yupRequiredWhenShared(yupNumber()),
      username: yupRequiredWhenShared(yupString()),
      password: yupRequiredWhenShared(yupString()),
      senderEmail: yupRequiredWhenShared(yupString().email()),
    }).optional().default(undefined),
    teamCreatorDefaultPermissionIds: yupArray(teamPermissionIdSchema.required()).optional().default(undefined),
    teamMemberDefaultPermissionIds: yupArray(teamPermissionIdSchema.required()).optional().default(undefined),
  }).optional().default(undefined),
};

export const getProjectUpdateSchema = () => yupObject({
  displayName: yupString().optional(),
  ...nonRequiredSchemas,
});

export const getProjectCreateSchema = () => yupObject({
  displayName: yupString().required(),
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
          };
        } else {
          throw new StatusError(StatusError.BadRequest, "Invalid oauth provider type");
        }
      }),
      emailConfig: update.config.emailConfig && (
        update.config.emailConfig.type === "shared" ? {
          type: update.config.emailConfig.type,
        } : {
          type: update.config.emailConfig.type,
          senderName: update.config.emailConfig.senderName!,
          host: update.config.emailConfig.host!,
          port: update.config.emailConfig.port!,
          username: update.config.emailConfig.username!,
          password: update.config.emailConfig.password!,
          senderEmail: update.config.emailConfig.senderEmail!,
        }
      ),
      teamCreatorDefaultPermissionIds: update.config.teamCreatorDefaultPermissionIds,
      teamMemberDefaultPermissionIds: update.config.teamMemberDefaultPermissionIds,
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
