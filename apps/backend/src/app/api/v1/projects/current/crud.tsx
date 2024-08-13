import { isTeamSystemPermission, listTeamPermissionDefinitions, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { fullProjectInclude, projectPrismaToCrud } from "@/lib/projects";
import { ensureSharedProvider } from "@/lib/request-checks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { projectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { yupObject } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { ensureStandardProvider } from "../../../../../lib/request-checks";

export const projectsCrudHandlers = createLazyProxy(() => createCrudHandlers(projectsCrud, {
  paramsSchema: yupObject({}),
  onUpdate: async ({ auth, data }) => {
    const oldProject = auth.project;

    const result = await prismaClient.$transaction(async (tx) => {
      // ======================= update default team permissions =======================

      const dbParams = [
        {
          type: 'creator',
          optionName: 'team_creator_default_permissions',
          dbName: 'teamCreatorDefaultPermissions',
          dbSystemName: 'teamCreateDefaultSystemPermissions',
        },
        {
          type: 'member',
          optionName: 'team_member_default_permissions',
          dbName: 'teamMemberDefaultPermissions',
          dbSystemName: 'teamMemberDefaultSystemPermissions',
        },
      ] as const;

      const permissions = await listTeamPermissionDefinitions(tx, oldProject);


      for (const param of dbParams) {
        const defaultPerms = data.config?.[param.optionName]?.map((p) => p.id);

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
          where: { id: oldProject.config.id },
          data: {
            [param.dbSystemName]: systemPerms,
          },
        });

        // Remove existing default permissions
        await tx.permission.updateMany({
          where: {
            projectConfigId: oldProject.config.id,
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
            projectConfigId: oldProject.config.id,
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
          where: { projectConfigId: oldProject.config.id },
        });
        await tx.proxiedEmailServiceConfig.deleteMany({
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

        await tx.emailServiceConfig.update({
          where: { projectConfigId: oldProject.config.id },
          data: updateData,
        });
      }

      // ======================= update oauth config =======================
      // loop though all the items from crud.config.oauth_providers
      // create the config if it is not already in the DB
      // update the config if it is already in the DB
      // set the enabled flag to false if it is not in the crud.config.oauth_providers but is in the DB

      const oldProviders = oldProject.config.oauth_providers;
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
          switch (oldProvider.type) {
            case 'shared': {
              await tx.proxiedOAuthProviderConfig.deleteMany({
                where: { projectConfigId: oldProject.config.id, id: providerUpdate.id },
              });
              break;
            }
            case 'standard': {
              await tx.standardOAuthProviderConfig.deleteMany({
                where: { projectConfigId: oldProject.config.id, id: providerUpdate.id },
              });
              break;
            }
          }

          // update provider configs with newly created proxied/standard provider configs
          let providerConfigUpdate;
          if (providerUpdate.type === 'shared') {
            providerConfigUpdate = {
              proxiedOAuthConfig: {
                create: {
                  type: typedToUppercase(ensureSharedProvider(providerUpdate.id)),
                },
              },
            };
          } else {
            providerConfigUpdate = {
              standardOAuthConfig: {
                create: {
                  type: typedToUppercase(ensureStandardProvider(providerUpdate.id)),
                  clientId: providerUpdate.client_id ?? throwErr('client_id is required'),
                  clientSecret: providerUpdate.client_secret ?? throwErr('client_secret is required'),
                  facebookConfigId: providerUpdate.facebook_config_id,
                },
              },
            };
          }

          await tx.oAuthProviderConfig.update({
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
                  type: typedToUppercase(ensureSharedProvider(provider.update.id)),
                },
              },
            };
          } else {
            providerConfigData = {
              standardOAuthConfig: {
                create: {
                  type: typedToUppercase(ensureStandardProvider(provider.update.id)),
                  clientId: provider.update.client_id ?? throwErr('client_id is required'),
                  clientSecret: provider.update.client_secret ?? throwErr('client_secret is required'),
                  facebookConfigId: provider.update.facebook_config_id,
                },
              },
            };
          }

          await tx.oAuthProviderConfig.create({
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

      return await tx.project.update({
        where: { id: auth.project.id },
        data: {
          displayName: data.display_name,
          description: data.description,
          isProductionMode: data.is_production_mode,
          config: {
            update: {
              signUpEnabled: data.config?.sign_up_enabled,
              credentialEnabled: data.config?.credential_enabled,
              magicLinkEnabled: data.config?.magic_link_enabled,
              clientTeamCreationEnabled: data.config?.client_team_creation_enabled,
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

    return projectPrismaToCrud(result);
  },
  onRead: async ({ auth }) => {
    return auth.project;
  },
  onDelete: async ({ auth }) => {
    await prismaClient.$transaction(async (tx) => {
      const configs = await tx.projectConfig.findMany({
        where: {
          id: auth.project.config.id
        },
        include: {
          projects: true
        }
      });

      if (configs.length !== 1) {
        throw new StatusError(StatusError.NotFound, 'Project config not found');
      }

      await tx.projectConfig.delete({
        where: {
          id: auth.project.config.id
        },
      });

      // delete managed ids from users
      const users = await tx.projectUser.findMany({
        where: {
          projectId: 'internal',
          serverMetadata: {
            path: ['managedProjectIds'],
            array_contains: auth.project.id
          }
        }
      });

      for (const user of users) {
        const updatedManagedProjectIds = (user.serverMetadata as any).managedProjectIds.filter(
          (id: any) => id !== auth.project.id
        ) as string[];

        await tx.projectUser.update({
          where: {
            projectId_projectUserId: {
              projectId: 'internal',
              projectUserId: user.projectUserId
            }
          },
          data: {
            serverMetadata: {
              ...user.serverMetadata as any,
              managedProjectIds: updatedManagedProjectIds,
            }
          }
        });
      }
    });
  }
}));
