import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { throwIfUndefined } from "@stackframe/stack-shared/dist/utils/errors";
import { projectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { typedToLowercase, typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { Prisma, ProxiedOAuthProviderType } from "@prisma/client";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import {
  serverPermissionDefinitionJsonFromDbType,
  serverPermissionDefinitionJsonFromTeamSystemDbType,
} from "@/lib/permissions";


export const projectsCrudHandlers = createPrismaCrudHandlers(projectsCrud, "project", {
  paramsSchema: yup.object({
    projectId: yup.string().required(),
  }),
  baseFields: async ({ params }) => ({
    id: params.projectId,
  }),
  where: async ({ auth }) => {
    let managedIds: string[] = [];
    if (auth.user?.project_id === 'internal') {
      managedIds = (auth.user.server_metadata as any)?.managedProjectIds || [];
    }
    
    return {
      id: { in: managedIds },
    };
  },
  whereUnique: async ({ auth, params }) => {
    let managedIds: string[] = [];
    if (auth.user?.project_id === 'internal') {
      managedIds = (auth.user.server_metadata as any)?.managedProjectIds || [];
    }
    
    return {
      id: params.projectId,
      AND: [
        { id: { in: managedIds } },
      ],
    };
  },
  include: async () => ({
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
          include: {
            parentEdges: {
              include: {
                parentPermission: true,
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
        users: true,
      },
    },
  }),
  notFoundError: () => new KnownErrors.ProjectNotFound(),
  crudToPrisma: async (crud, { auth, params }) => {
    const oldProject = await prismaClient.project.findUnique({
      where: {
        id: params.projectId,
      },
      include: {
        config: true,
      },
    });

    // ======================= email config =======================
    // update the corresponding config type if it is already defined
    // delete the other config type
    // create the config type if it is not defined

    let emailConfigCreate: Prisma.EmailServiceConfigCreateWithoutProjectConfigInput;
    let emailConfigUpdate: Prisma.EmailServiceConfigUpdateWithoutProjectConfigInput;

    if (crud.config?.email_config?.type === "standard") {
      const createParams = {
        senderEmail: throwIfUndefined(crud.config.email_config.sender_email, "sender_email"),
        senderName: throwIfUndefined(crud.config.email_config.sender_name, "sender_name"),
        host: throwIfUndefined(crud.config.email_config.host, "host"),
        port: throwIfUndefined(crud.config.email_config.port, "port"),
        username: throwIfUndefined(crud.config.email_config.username, "username"),
        password: throwIfUndefined(crud.config.email_config.password, "password"),
      } as const;

      emailConfigCreate = {
        standardEmailServiceConfig: {
          create: createParams,
        },
      };

      emailConfigUpdate = {
        standardEmailServiceConfig: {
          create: createParams,
          update: createParams,
        },
        proxiedEmailServiceConfig: {
          delete: true,
        }
      };
    } else {
      emailConfigCreate = {
        proxiedEmailServiceConfig: {
          create: {}
        },
      };

      emailConfigUpdate = {
        proxiedEmailServiceConfig: {
          create: {},
          update: {},
        },
        standardEmailServiceConfig: {
          delete: true,
        }
      };
    }

    const emailServiceConfig = crud.config?.email_config ? {
      create: emailConfigCreate,
      update: emailConfigUpdate,
    } : undefined;

    // ======================= domain config =======================
    // delete all domains and re-create based on crud.config.domains

    const domains = crud.config?.domains ? {
      set: [],
      create: crud.config.domains.map(item => ({
        domain: item.domain,
        handlerPath: item.handler_path,
      })),
    } : undefined;
    
    // ======================= oauth config =======================
    // loop though all the items from crud.config.oauth_providers
    // create the config if it is not already in the DB
    // update the config if it is already in the DB
    // set the enabled flag to false if it is not in the crud.config.oauth_providers but is in the DB

    let oauthProviderConfigs: Prisma.OAuthProviderConfigUpdateManyWithoutProjectConfigNestedInput | undefined = undefined;

    if (crud.config?.oauth_providers) {
      const createOAuthConfig = (item: typeof crud.config.oauth_providers[number]) => {
        if (item.type === "standard") {
          return {
            standardOAuthConfig: {
              create: {
                type: typedToUppercase(item.id),
                clientId: throwIfUndefined(item.client_id, "client_id"),
                clientSecret: throwIfUndefined(item.client_secret, "client_secret"),
              }
            },
            proxiedOAuthConfig: {
              delete: true,
            }
          };
        } else {
          return {
            proxiedOAuthConfig: {
              create: {
                type: typedToUppercase(item.id)
              }
            },
            standardOAuthConfig: {
              delete: true,
            }
          };
        
        }
      };

      oauthProviderConfigs = {
        create: crud.config.oauth_providers.map(item => ({
          id: item.id,
          enabled: true,
          ...createOAuthConfig(item),
        })),
        update: crud.config.oauth_providers.map(item => ({
          where: {
            projectConfigId_id: {
              projectConfigId: throwIfUndefined(oldProject?.config.id, "oldProject.config.id"),
              id: item.id,
            }
          },
          data: {
            enabled: true,
            ...createOAuthConfig(item),
          }
        })),
      };
    }

    // ======================= full update =======================

    return {
      displayName: crud.display_name,
      description: crud.description,
      isProductionMode: crud.is_production_mode,
      config: {
        update: {
          credentialEnabled: crud.config?.credential_enabled,
          magicLinkEnabled: crud.config?.magic_link_enabled,
          allowLocalhost: crud.config?.allow_localhost,
          createTeamOnSignUp: crud.config?.create_team_on_sign_up,
          domains,
          oauthProviderConfigs,
          emailServiceConfig,
        },
        create: {
          credentialEnabled: crud.config?.credential_enabled || false,
          magicLinkEnabled: crud.config?.magic_link_enabled || false,
          allowLocalhost: crud.config?.allow_localhost || true,
          createTeamOnSignUp: crud.config?.create_team_on_sign_up || false,
          domains,
          emailServiceConfig: crud.config?.email_config ? emailServiceConfig : {
            create: {
              proxiedEmailServiceConfig: {
                create: {}
              },
            },
          }
        }
      }
    };
  },
  prismaToCrud: async (prisma, { auth }) => {
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
        domains: prisma.config.domains.map((domain) => ({
          domain: domain.domain,
          handler_path: domain.handlerPath,
        })),
        oauth_providers: prisma.config.oauthProviderConfigs.flatMap((provider):  { 
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
        }),
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
        teamCreatorDefaultPermissions: prisma.config.permissions.filter(perm => perm.isDefaultTeamCreatorPermission)
          .map(serverPermissionDefinitionJsonFromDbType)
          .concat(prisma.config.teamCreateDefaultSystemPermissions.map(serverPermissionDefinitionJsonFromTeamSystemDbType)),
        teamMemberDefaultPermissions: prisma.config.permissions.filter(perm => perm.isDefaultTeamMemberPermission)
          .map(serverPermissionDefinitionJsonFromDbType)
          .concat(prisma.config.teamMemberDefaultSystemPermissions.map(serverPermissionDefinitionJsonFromTeamSystemDbType)),  
      }
    };
  },
});
