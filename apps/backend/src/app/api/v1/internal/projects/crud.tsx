import { isTeamSystemPermission, listPermissionDefinitions, permissionDefinitionJsonFromDbType, permissionDefinitionJsonFromTeamSystemDbType, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { listManagedProjectIds } from "@/lib/projects";
import { prismaClient } from "@/prisma-client";
import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { Prisma, ProxiedOAuthProviderType } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { internalProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToLowercase, typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";

export const internalProjectsCrudHandlers = createPrismaCrudHandlers(internalProjectsCrud, "project", {
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
  baseFields: async ({ params }) => ({
    id: params.projectId,
  }),
  where: async ({ auth }) => {
    const managedProjectIds = listManagedProjectIds(auth.user ?? throwErr('auth.user is required'));
    return {
      id: { in: managedProjectIds },
    };
  },
  whereUnique: async ({ auth, params }) => {
    const managedProjectIds = listManagedProjectIds(auth.user ?? throwErr('auth.user is required'));
    return {
      id: params.projectId,
      AND: [
        { id: { in: managedProjectIds } },
      ],
    };
  },
  orderBy: async () => ({
    createdAt: 'desc',
  }),
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
    _count: {
      select: {
        users: true,
      },
    },
  }),
  notFoundToCrud: (context) => {
    throw new KnownErrors.ProjectNotFound();
  },
  crudToPrisma: async (crud, { auth, params, type }) => {
    // ======================= create =======================

    if (type === 'create') {
      return {
        id: generateUuid(),
        displayName: crud.display_name ?? throwErr('display_name is required'),
        description: crud.description,
        isProductionMode: crud.is_production_mode || false,
        config: {
          create: {
            credentialEnabled: crud.config?.credential_enabled || true,
            magicLinkEnabled: crud.config?.magic_link_enabled || false,
            allowLocalhost: crud.config?.allow_localhost || true,
            createTeamOnSignUp: crud.config?.create_team_on_sign_up || false,
            domains: crud.config?.domains ? {
              create: crud.config.domains.map(item => ({
                domain: item.domain,
                handlerPath: item.handler_path,
              }))
            } : undefined,
            oauthProviderConfigs: crud.config?.oauth_providers ? {
              create: crud.config.oauth_providers.map(item => ({
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
            emailServiceConfig: crud.config?.email_config ? {
              create: {
                proxiedEmailServiceConfig: crud.config.email_config.type === "shared" ? {
                  create: {}
                } : undefined,
                standardEmailServiceConfig: crud.config.email_config.type === "standard" ? {
                  create: {
                    host: crud.config.email_config.host ?? throwErr('host is required'),
                    port: crud.config.email_config.port ?? throwErr('port is required'),
                    username: crud.config.email_config.username ?? throwErr('username is required'),
                    password: crud.config.email_config.password ?? throwErr('password is required'),
                    senderEmail: crud.config.email_config.sender_email ?? throwErr('sender_email is required'),
                    senderName: crud.config.email_config.sender_name ?? throwErr('sender_name is required'),
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
      } satisfies Prisma.ProjectCreateInput;
    }

    // ======================= get the old project =======================
    const oldProject = await prismaClient.project.findUnique({
      where: {
        id: params.projectId,
      },
      include: {
        config: {
          include: {
            emailServiceConfig: {
              include: {
                proxiedEmailServiceConfig: true,
                standardEmailServiceConfig: true,
              },
            },
            domains: true,
            oauthProviderConfigs: {
              include: {
                proxiedOAuthConfig: true,
                standardOAuthConfig: true,
              },
            },
          }
        }
      },
    });

    // the project does not exist, the update operation is invalid
    if (!oldProject) {
      return {};
    }

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
    
    const transactions = [];
    const permissions = await listPermissionDefinitions(auth.project, { type: 'any-team' });

    for (const param of dbParams) {
      const defaultPerms = crud.config?.[param.optionName];
      
      if (!defaultPerms) {
        continue;
      }
      
      if (!defaultPerms.every((id) => permissions.some((perm) => perm.id === id))) {
        throw new StatusError(StatusError.BadRequest, "Invalid team default permission ids");
      }
      
      const systemPerms = defaultPerms
        .filter(p => isTeamSystemPermission(p))
        .map(p => teamSystemPermissionStringToDBType(p as any));
  
        transactions.push(prismaClient.projectConfig.update({
          where: { id: auth.project.evaluatedConfig.id },
          data: {
            [param.dbSystemName]: systemPerms,
          },
        }));
        
        // Remove existing default permissions
        transactions.push(prismaClient.permission.updateMany({
          where: {
            projectConfigId: auth.project.evaluatedConfig.id,
            scope: 'TEAM',
          },
          data: {
            isDefaultTeamCreatorPermission: param.type === 'creator' ? false : undefined,
            isDefaultTeamMemberPermission: param.type === 'member' ? false : undefined,
          },
        }));
  
        // Add new default permissions
        transactions.push(prismaClient.permission.updateMany({
          where: {
            projectConfigId: auth.project.evaluatedConfig.id,
            queryableId: {
              in: defaultPerms.filter(x => !isTeamSystemPermission(x)),
            },
            scope: 'TEAM',
          },
          data: {
            isDefaultTeamCreatorPermission: param.type === 'creator',
            isDefaultTeamMemberPermission: param.type === 'member',
          },
        }));
    }

    await prismaClient.$transaction(transactions);

    // ======================= update email config =======================
    // update the corresponding config type if it is already defined
    // delete the other config type
    // create the config type if it is not defined

    const emailConfig = crud.config?.email_config;
    if (emailConfig) {
      let updateData = {};

      await prismaClient.standardEmailServiceConfig.deleteMany({
        where: { projectConfigId: oldProject.config.id },
      });
      await prismaClient.proxiedEmailServiceConfig.deleteMany({
        where: { projectConfigId: oldProject.config.id },
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

      await prismaClient.emailServiceConfig.update({
        where: { projectConfigId: oldProject.config.id },
        data: updateData,
      });
    }
    
    // ======================= update oauth config =======================
    // loop though all the items from crud.config.oauth_providers
    // create the config if it is not already in the DB
    // update the config if it is already in the DB
    // set the enabled flag to false if it is not in the crud.config.oauth_providers but is in the DB

    const oldProviders = oldProject.config.oauthProviderConfigs;
    const oauthProviderUpdates = crud.config?.oauth_providers;
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
        if (oldProvider.proxiedOAuthConfig) {
          await prismaClient.proxiedOAuthProviderConfig.deleteMany({
            where: { projectConfigId: oldProject.config.id, id: providerUpdate.id },
          });
        }
        if (oldProvider.standardOAuthConfig) {
          await prismaClient.standardOAuthProviderConfig.deleteMany({
            where: { projectConfigId: oldProject.config.id, id: providerUpdate.id },
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
    
        await prismaClient.oAuthProviderConfig.update({
          where: { projectConfigId_id: { projectConfigId: oldProject.config.id, id } },
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

        await prismaClient.oAuthProviderConfig.create({
          data: {
            id: provider.id,
            projectConfigId: oldProject.config.id,
            enabled: provider.update.enabled,
            ...providerConfigData,
          },
        });
      }
    }

    // ======================= update the rest =======================

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
          domains: crud.config?.domains ? {
            deleteMany: {},
            create: crud.config.domains.map(item => ({
              domain: item.domain,
              handlerPath: item.handler_path,
            })),
          } : undefined
        },
      },
    } satisfies Prisma.ProjectUpdateInput;
  },
  onCreate: async (prisma, { auth }) => {
    const user = auth.user ?? throwErr('auth.user is required');

    await prismaClient.$transaction(async (tx) => {
      await tx.permission.create({
        data: {
          projectId: prisma.id,
          projectConfigId: prisma.config.id,
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
          projectId: prisma.id,
          projectConfigId: prisma.config.id,
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
              prisma.id,
            ],
          },
        },
      });
    });
  },
  prismaToCrud: async (prisma) => {
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
        teamCreatorDefaultPermissions: prisma.config.permissions.filter(perm => perm.isDefaultTeamCreatorPermission)
          .map(permissionDefinitionJsonFromDbType)
          .concat(prisma.config.teamCreateDefaultSystemPermissions.map(permissionDefinitionJsonFromTeamSystemDbType))
          .sort((a, b) => a.id.localeCompare(b.id)),
        teamMemberDefaultPermissions: prisma.config.permissions.filter(perm => perm.isDefaultTeamMemberPermission)
          .map(permissionDefinitionJsonFromDbType)
          .concat(prisma.config.teamMemberDefaultSystemPermissions.map(permissionDefinitionJsonFromTeamSystemDbType))
          .sort((a, b) => a.id.localeCompare(b.id)),
      }
    };
  },
});
