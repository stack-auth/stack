import { isTeamSystemPermission, listTeamPermissionDefinitions, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { fullProjectInclude, projectPrismaToCrud } from "@/lib/projects";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { projectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { yupObject } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";

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
      // 1. check if the old provider config ids is a subset of the new provider config ids
      // 2. loop through the new provider config ids
      //   - if the new provider config id is not in the old provider config ids, create it
      //   - if the new provider config is in the old provider config ids, remove the proxied/standard oauth config
      //   - create the new proxied/standard oauth config

      const oldProviderConfigIds = oldProject.config.enabled_oauth_provider_configs.map(p => p.id);
      const newProviderConfigIds = data.config?.oauth_provider_configs?.map(p => p.id) ?? [];

      if (!oldProviderConfigIds.every(id => newProviderConfigIds.includes(id))) {
        throw new StatusError(StatusError.BadRequest, `Invalid OAuth provider configuration IDs. Removal of provider configurations is not allowed.`);
      }

      for (const newConfig of data.config?.oauth_provider_configs ?? []) {
        const createdConfig = await tx.oAuthProviderConfig.upsert({
          where: {
            projectConfigId_id: {
              projectConfigId: oldProject.config.id,
              id: newConfig.id,
            }
          },
          create: {
            id: newConfig.id,
            projectConfigId: oldProject.config.id,
          },
          update: {
            proxiedOAuthConfig: {
              delete: true,
            },
            standardOAuthConfig: {
              delete: true,
            },
          },
        });

        if (newConfig.shared) {
          await tx.proxiedOAuthProviderConfig.create({
            data: {
              projectConfigId: oldProject.config.id,
              id: createdConfig.id,
              type: typedToUppercase(newConfig.type),
            },
          });
        } else {
          await tx.standardOAuthProviderConfig.create({
            data: {
              projectConfigId: oldProject.config.id,
              id: createdConfig.id,
              type: typedToUppercase(newConfig.type),
              clientId: newConfig.client_id,
              clientSecret: newConfig.client_secret,
              facebookConfigId: newConfig.facebook_config_id,
              microsoftTenantId: newConfig.microsoft_tenant_id,
            },
          });
        }
      }

      // ======================= auth methods =======================
      // 1. check if the old auth method ids is a subset of the new auth method ids
      // 2. check if the auth method types are still the same
      // 3. loop through all the auth methods
      //   - create/update the auth method

      for (const oldAuthMethod of oldProject.config.auth_method_configs) {
        const newAuthMethod = data.config?.auth_method_configs?.find(p => p.id === oldAuthMethod.id);
        if (!newAuthMethod) {
          throw new StatusError(StatusError.BadRequest, `Auth method config ID ${oldAuthMethod.id} not found`);
        }

        if (newAuthMethod.type !== oldAuthMethod.type) {
          throw new StatusError(StatusError.BadRequest, `Auth method type mismatch for ID ${oldAuthMethod.id}`);
        }
      }

      for (const newAuthMethod of data.config?.auth_method_configs ?? []) {
        await tx.authMethodConfig.upsert({
          where: {
            projectConfigId_id: {
              projectConfigId: oldProject.config.id,
              id: newAuthMethod.id,
            }
          },
          create: {
            id: newAuthMethod.id,
            projectConfigId: oldProject.config.id,
            ...(() => {
              switch (newAuthMethod.type) {
                case 'password': {
                  return {
                    passwordConfig: {
                      create: {
                        identifierType: 'EMAIL',
                      },
                    },
                  };
                }
                case 'otp': {
                  return {
                    otpConfig: {
                      create: {
                        contactChannelType: 'EMAIL',
                      },
                    },
                  };
                }
                case 'oauth': {
                  return {
                    type: 'OAUTH',
                    oauthProviderConfig: {
                      connect: {
                        projectConfigId_id: {
                          projectConfigId: oldProject.config.id,
                          id: newAuthMethod.oauth_provider_config_id,
                        }
                      },
                    },
                  };
                }
              }
            })()
          },
          update: {},
        });
      }

      // ======================= update the rest =======================

      // check domain uniqueness
      if (data.config?.domains) {
        const domains = data.config.domains.map((item) => item.domain);
        if (new Set(domains).size !== domains.length) {
          throw new StatusError(StatusError.BadRequest, 'Duplicated domain found');
        }
      }

      return await tx.project.update({
        where: { id: auth.project.id },
        data: {
          displayName: data.display_name,
          description: data.description,
          isProductionMode: data.is_production_mode,
          config: {
            update: {
              signUpEnabled: data.config?.sign_up_enabled,
              clientTeamCreationEnabled: data.config?.client_team_creation_enabled,
              clientUserDeletionEnabled: data.config?.client_user_deletion_enabled,
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
