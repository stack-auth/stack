import { isTeamSystemPermission, listPermissionDefinitions, permissionDefinitionJsonFromDbType, permissionDefinitionJsonFromTeamSystemDbType, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { getProject, listManagedProjectIds } from "@/lib/projects";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { Prisma, ProxiedOAuthProviderType } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { sharedProviders, standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { internalProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase, typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";

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
  _count: {
    select: {
      users: true,
    },
  },
};

function prismaToCrud(prisma: Prisma.ProjectGetPayload<{ include: typeof fullProjectInclude }>): any {
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
      })).sort((a, b) => a.domain.localeCompare(b.domain)),
      oauth_providers: prisma.config.oauthProviderConfigs.flatMap((provider): { 
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
      }).sort((a, b) => a.id.localeCompare(b.id)),
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

export const internalProjectsCrudHandlers = createCrudHandlers(internalProjectsCrud, {
  paramsSchema: yupObject({
    projectId: yupString().required(),
  }),
  onPrepare: async ({ auth }) => {
    if (!auth.user) {
      throw new KnownErrors.UserAuthenticationRequired();
    }
    if (auth.user.project_id !== 'internal') {
      throw new KnownErrors.ExpectedInternalProject();
    }
  },
  onCreate: async ({ auth, data }) => {
    const user = auth.user ?? throwErr('auth.user is required');

    const result = await prismaClient.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          id: generateUuid(),
          displayName: data.display_name,
          description: data.description,
          isProductionMode: data.is_production_mode || false,
          config: {
            create: {
              credentialEnabled: data.config?.credential_enabled || true,
              magicLinkEnabled: data.config?.magic_link_enabled || false,
              allowLocalhost: data.config?.allow_localhost || true,
              createTeamOnSignUp: data.config?.create_team_on_sign_up || false,
              domains: data.config?.domains ? {
                create: data.config.domains.map(item => ({
                  domain: item.domain,
                  handlerPath: item.handler_path,
                }))
              } : undefined,
              oauthProviderConfigs: data.config?.oauth_providers ? {
                create: data.config.oauth_providers.map(item => ({
                  id: item.id,
                  enabled: item.enabled,
                  proxiedOAuthConfig: item.type === "shared" ? {
                    create: {
                      type: typedToUppercase(item.id),
                    }
                  } : undefined,
                  standardOAuthConfig: item.type === "standard" ? {
                    create: {
                      type: typedToUppercase(item.id),
                      clientId: item.client_id ?? throwErr('client_id is required'),
                      clientSecret: item.client_secret ?? throwErr('client_secret is required'),
                    }
                  } : undefined,
                }))
              } : undefined,
              emailServiceConfig: data.config?.email_config ? {
                create: {
                  proxiedEmailServiceConfig: data.config.email_config.type === "shared" ? {
                    create: {}
                  } : undefined,
                  standardEmailServiceConfig: data.config.email_config.type === "standard" ? {
                    create: {
                      host: data.config.email_config.host ?? throwErr('host is required'),
                      port: data.config.email_config.port ?? throwErr('port is required'),
                      username: data.config.email_config.username ?? throwErr('username is required'),
                      password: data.config.email_config.password ?? throwErr('password is required'),
                      senderEmail: data.config.email_config.sender_email ?? throwErr('sender_email is required'),
                      senderName: data.config.email_config.sender_name ?? throwErr('sender_name is required'),
                    }
                  } : undefined,
                }
              } : {
                create: {
                  proxiedEmailServiceConfig: {
                    create: {}
                  },
                },
              },
            },
          }
        },
        include: fullProjectInclude,
      });

      await tx.permission.create({
        data: {
          projectId: project.id,
          projectConfigId: project.config.id,
          queryableId: "member",
          description: "Default permission for team members",
          scope: 'TEAM',
          parentEdges: {
            createMany: {
              data: (['READ_MEMBERS', 'INVITE_MEMBERS'] as const).map(p => ({ parentTeamSystemPermission: p })),
            },
          },
          isDefaultTeamMemberPermission: true,
        },
      });
      
      await tx.permission.create({
        data: {
          projectId: project.id,
          projectConfigId: project.config.id,
          queryableId: "admin",
          description: "Default permission for team creators",
          scope: 'TEAM',
          parentEdges: {
            createMany: {
              data: (['UPDATE_TEAM', 'DELETE_TEAM', 'READ_MEMBERS', 'REMOVE_MEMBERS', 'INVITE_MEMBERS'] as const).map(p =>({ parentTeamSystemPermission: p }))
            },
          },
          isDefaultTeamCreatorPermission: true,
        },
      });
  
      const projectUserTx = await tx.projectUser.findUniqueOrThrow({
        where: {
          projectId_projectUserId: {
            projectId: "internal",
            projectUserId: user.id,
          },
        },
      });
  
      const serverMetadataTx: any = projectUserTx.serverMetadata ?? {};
  
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

      const result = await tx.project.findUnique({
        where: { id: project.id },
        include: fullProjectInclude,
      });

      if (!result) {
        throw new StackAssertionError(`Project with id '${project.id}' not found after creation`, { project });
      }
      return result;
    });

    return prismaToCrud(result);
  },
  onUpdate: async ({ data, params }) => {
    const oldProject = await getProject(params.projectId);

    // the project does not exist, the update operation is invalid
    if (!oldProject) {
      throw new KnownErrors.ProjectNotFound();
    }

    const result = await prismaClient.$transaction(async (tx) => {
      // ======================= update default team permissions =======================

      const dbParams = [
        {
          type: 'creator',
          optionName: 'team_creator_default_permission_ids',
          dbName: 'teamCreatorDefaultPermissions',
          dbSystemName: 'teamCreateDefaultSystemPermissions',
        },
        {
          type: 'member',
          optionName: 'team_member_default_permission_ids',
          dbName: 'teamMemberDefaultPermissions',
          dbSystemName: 'teamMemberDefaultSystemPermissions',
        },
      ] as const;
    
      const permissions = await listPermissionDefinitions(oldProject, { type: 'any-team' });


      for (const param of dbParams) {
        const defaultPerms = data.config?.[param.optionName];
        
        if (!defaultPerms) {
          continue;
        }
        
        if (!defaultPerms.every((id) => permissions.some((perm) => perm.id === id))) {
          throw new StatusError(StatusError.BadRequest, "Invalid team default permission ids");
        }
        
        const systemPerms = defaultPerms
          .filter(p => isTeamSystemPermission(p))
          .map(p => teamSystemPermissionStringToDBType(p as any));
    
        await tx.projectConfig.update({
          where: { id: oldProject.evaluatedConfig.id },
          data: {
            [param.dbSystemName]: systemPerms,
          },
        });
        
        // Remove existing default permissions
        await tx.permission.updateMany({
          where: {
            projectConfigId: oldProject.evaluatedConfig.id,
            scope: 'TEAM',
          },
          data: {
            isDefaultTeamCreatorPermission: param.type === 'creator' ? false : undefined,
            isDefaultTeamMemberPermission: param.type === 'member' ? false : undefined,
          },
        });
  
        // Add new default permissions
        await tx.permission.updateMany({
          where: {
            projectConfigId: oldProject.evaluatedConfig.id,
            queryableId: {
              in: defaultPerms.filter(x => !isTeamSystemPermission(x)),
            },
            scope: 'TEAM',
          },
          data: {
            isDefaultTeamCreatorPermission: param.type === 'creator',
            isDefaultTeamMemberPermission: param.type === 'member',
          },
        });
      }

      // ======================= update email config =======================
      // update the corresponding config type if it is already defined
      // delete the other config type
      // create the config type if it is not defined

      const emailConfig = data.config?.email_config;
      if (emailConfig) {
        let updateData = {};

        await tx.standardEmailServiceConfig.deleteMany({
          where: { projectConfigId: oldProject.evaluatedConfig.id },
        });
        await tx.proxiedEmailServiceConfig.deleteMany({
          where: { projectConfigId: oldProject.evaluatedConfig.id },
        });


        if (emailConfig.type === 'standard') {
          updateData = {
            standardEmailServiceConfig: {
              create: {
                host: emailConfig.host ?? throwErr('host is required'),
                port: emailConfig.port ?? throwErr('port is required'),
                username: emailConfig.username ?? throwErr('username is required'),
                password: emailConfig.password ?? throwErr('password is required'),
                senderEmail: emailConfig.sender_email ?? throwErr('sender_email is required'),
                senderName: emailConfig.sender_name ?? throwErr('sender_name is required'),
              },
            },
          };
        } else {
          updateData = {
            proxiedEmailServiceConfig: {
              create: {},
            },
          };
        }

        await tx.emailServiceConfig.update({
          where: { projectConfigId: oldProject.evaluatedConfig.id },
          data: updateData,
        });
      }
    
      // ======================= update oauth config =======================
      // loop though all the items from crud.config.oauth_providers
      // create the config if it is not already in the DB
      // update the config if it is already in the DB
      // set the enabled flag to false if it is not in the crud.config.oauth_providers but is in the DB

      const oldProviders = oldProject.evaluatedConfig.oauthProviders;
      const oauthProviderUpdates = data.config?.oauth_providers;
      if (oauthProviderUpdates) {
        const providerMap = new Map(oldProviders.map((provider) => [
          provider.id, 
          {
            providerUpdate: (() => {
              const update = oauthProviderUpdates.find((p) => p.id === provider.id);
              if (!update) {
                throw new StatusError(StatusError.BadRequest, `Provider with id '${provider.id}' not found in the update`);
              }
              return update;
            })(),
            oldProvider: provider,
          }
        ]));

        const newProviders =  oauthProviderUpdates.map((providerUpdate) => ({
          id: providerUpdate.id, 
          update: providerUpdate
        })).filter(({ id }) => !providerMap.has(id));

        // Update existing proxied/standard providers
        for (const [id, { providerUpdate, oldProvider }] of providerMap) {
        // remove existing provider configs
          if (sharedProviders.includes(oldProvider.type as any)) {
            await tx.proxiedOAuthProviderConfig.deleteMany({
              where: { projectConfigId: oldProject.evaluatedConfig.id, id: providerUpdate.id },
            });
          }
          if (standardProviders.includes(oldProvider.type as any)) {
            await tx.standardOAuthProviderConfig.deleteMany({
              where: { projectConfigId: oldProject.evaluatedConfig.id, id: providerUpdate.id },
            });
          }
    
          // update provider configs with newly created proxied/standard provider configs
          let providerConfigUpdate;
          if (providerUpdate.type === 'shared') {
            providerConfigUpdate = {
              proxiedOAuthConfig: {
                create: {
                  type: typedToUppercase(providerUpdate.id),
                },
              },
            };
    
          } else {
            providerConfigUpdate = {
              standardOAuthConfig: {
                create: {
                  type: typedToUppercase(providerUpdate.id),
                  clientId: providerUpdate.client_id ?? throwErr('client_id is required'),
                  clientSecret: providerUpdate.client_secret ?? throwErr('client_secret is required'),
                },
              },
            };
          }
    
          await tx.oAuthProviderConfig.update({
            where: { projectConfigId_id: { projectConfigId: oldProject.evaluatedConfig.id, id } },
            data: {
              enabled: providerUpdate.enabled,
              ...providerConfigUpdate,
            },
          });
        }

        // Create new providers
        for (const provider of newProviders) {
          let providerConfigData;
          if (provider.update.type === 'shared') {
            providerConfigData = {
              proxiedOAuthConfig: {
                create: {
                  type: typedToUppercase(provider.update.id),
                },
              },
            };
          } else {
            providerConfigData = {
              standardOAuthConfig: {
                create: {
                  type: typedToUppercase(provider.update.id),
                  clientId: provider.update.client_id ?? throwErr('client_id is required'),
                  clientSecret: provider.update.client_secret ?? throwErr('client_secret is required'),
                },
              },
            };
          }

          await tx.oAuthProviderConfig.create({
            data: {
              id: provider.id,
              projectConfigId: oldProject.evaluatedConfig.id,
              enabled: provider.update.enabled,
              ...providerConfigData,
            },
          });
        }
      }

      // ======================= update the rest =======================

      return await tx.project.update({
        where: { id: params.projectId },
        data: {
          displayName: data.display_name,
          description: data.description,
          isProductionMode: data.is_production_mode,
          config: {
            update: {
              credentialEnabled: data.config?.credential_enabled,
              magicLinkEnabled: data.config?.magic_link_enabled,
              allowLocalhost: data.config?.allow_localhost,
              createTeamOnSignUp: data.config?.create_team_on_sign_up,
              domains: data.config?.domains ? {
                deleteMany: {},
                create: data.config.domains.map(item => ({
                  domain: item.domain,
                  handlerPath: item.handler_path,
                })),
              } : undefined
            },
          }
        },
        include: fullProjectInclude,
      });
    });

    return prismaToCrud(result);
  },
  onRead: async ({ params }) => {
    const result = await prismaClient.project.findUnique({
      where: { id: params.projectId },
      include: fullProjectInclude,
    });

    if (!result) {
      throw new KnownErrors.ProjectNotFound();
    }

    return prismaToCrud(result);
  },
  onList: async ({ auth }) => {
    const results = await prismaClient.project.findMany({
      where: {
        id: { in: listManagedProjectIds(auth.user ?? throwErr('auth.user is required')) },
      },
      include: fullProjectInclude,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: results.map(prismaToCrud),
      is_paginated: false,
    };
  }
});