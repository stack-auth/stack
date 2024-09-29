import { fullProjectInclude, listManagedProjectIds, projectPrismaToCrud } from "@/lib/projects";
import { ensureSharedProvider, ensureStandardProvider } from "@/lib/request-checks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { internalProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { projectIdSchema, yupObject } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, captureError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";

// if one of these users creates a project, the others will be added as owners
const ownerPacks = [
  new Set([
    "c2c03bd1-5cbe-4493-8e3f-17d1e2d7ca43",
    "60b859bf-e148-4eff-9985-fe6e31c58a2a",
    "1343e3e7-dd7a-44a1-8752-701c0881da72",
  ]),
];

// if the user is in this list, the project will not have sign-up enabled on creation
const disableSignUpByDefault = new Set([
  "c2c03bd1-5cbe-4493-8e3f-17d1e2d7ca43",
  "60b859bf-e148-4eff-9985-fe6e31c58a2a",
  "1343e3e7-dd7a-44a1-8752-701c0881da72",
]);

export const internalProjectsCrudHandlers = createLazyProxy(() => createCrudHandlers(internalProjectsCrud, {
  paramsSchema: yupObject({
    projectId: projectIdSchema.required(),
  }),
  onPrepare: async ({ auth }) => {
    if (!auth.user) {
      throw new KnownErrors.UserAuthenticationRequired();
    }
    if (auth.project.id !== "internal") {
      throw new KnownErrors.ExpectedInternalProject();
    }
  },
  onCreate: async ({ auth, data }) => {
    const user = auth.user ?? throwErr('auth.user is required');
    const ownerPack = ownerPacks.find(p => p.has(user.id));
    const userIds = ownerPack ? [...ownerPack] : [user.id];

    const result = await prismaClient.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          id: generateUuid(),
          displayName: data.display_name,
          description: data.description,
          isProductionMode: data.is_production_mode ?? false,
          config: {
            create: {
              signUpEnabled: data.config?.sign_up_enabled ?? (disableSignUpByDefault.has(user.id) ? false : true),
              allowLocalhost: data.config?.allow_localhost ?? true,
              createTeamOnSignUp: data.config?.create_team_on_sign_up ?? false,
              clientTeamCreationEnabled: data.config?.client_team_creation_enabled ?? false,
              clientUserDeletionEnabled: data.config?.client_user_deletion_enabled ?? false,
              domains: data.config?.domains ? {
                create: data.config.domains.map(item => ({
                  domain: item.domain,
                  handlerPath: item.handler_path,
                }))
              } : undefined,
              oauthProviderConfigs: data.config?.oauth_providers ? {
                create: data.config.oauth_providers.map(item => ({
                  id: item.id,
                  proxiedOAuthConfig: item.type === "shared" ? {
                    create: {
                      type: typedToUppercase(ensureSharedProvider(item.id)),
                    }
                  } : undefined,
                  standardOAuthConfig: item.type === "standard" ? {
                    create: {
                      type: typedToUppercase(ensureStandardProvider(item.id)),
                      clientId: item.client_id ?? throwErr('client_id is required'),
                      clientSecret: item.client_secret ?? throwErr('client_secret is required'),
                      facebookConfigId: item.facebook_config_id,
                      microsoftTenantId: item.microsoft_tenant_id,
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

      // all oauth providers are created as auth methods for backwards compatibility
      await tx.projectConfig.update({
        where: {
          id: project.config.id,
        },
        data: {
          authMethodConfigs: {
            create: [
              ...data.config?.oauth_providers ? project.config.oauthProviderConfigs.map(item => ({
                enabled: (data.config?.oauth_providers?.find(p => p.id === item.id) ?? throwErr("oauth provider not found")).enabled,
                oauthProviderConfig: {
                  connect: {
                    projectConfigId_id: {
                      projectConfigId: project.config.id,
                      id: item.id,
                    }
                  }
                }
              })) : [],
              ...data.config?.magic_link_enabled ? [{
                enabled: true,
                otpConfig: {
                  create: {
                    contactChannelType: 'EMAIL',
                  }
                },
              }] : [],
              ...(data.config?.credential_enabled ?? true) ? [{
                enabled: true,
                passwordConfig: {
                  create: {}
                },
              }] : [],
            ]
          }
        }
      });

      // all standard oauth providers are created as connected accounts for backwards compatibility
      await tx.projectConfig.update({
        where: {
          id: project.config.id,
        },
        data: {
          connectedAccountConfigs: data.config?.oauth_providers ? {
            create: project.config.oauthProviderConfigs.map(item => ({
              enabled: (data.config?.oauth_providers?.find(p => p.id === item.id) ?? throwErr("oauth provider not found")).enabled,
              oauthProviderConfig: {
                connect: {
                  projectConfigId_id: {
                    projectConfigId: project.config.id,
                    id: item.id,
                  }
                }
              }
            })),
          } : undefined,
        }
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

      // Update owner metadata
      for (const userId of userIds) {
        const projectUserTx = await tx.projectUser.findUnique({
          where: {
            projectId_projectUserId: {
              projectId: "internal",
              projectUserId: userId,
            },
          },
        });
        if (!projectUserTx) {
          if (userId === user.id) {
            throw new StackAssertionError(`User with id '${userId}' not found after creation`, { user });
          } else {
            captureError("project-creation-owner-packs", new StackAssertionError(`User ${userId} in owner pack not found. The user that created this project is in an owner pack, but no user with that ID was found. Did they delete their account? Continuing silently, but you should probably update the owner pack.`, { userId, creator: user }));
            continue;
          }
        }

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
      }

      const result = await tx.project.findUnique({
        where: { id: project.id },
        include: fullProjectInclude,
      });

      if (!result) {
        throw new StackAssertionError(`Project with id '${project.id}' not found after creation`, { project });
      }
      return result;
    });

    return projectPrismaToCrud(result);
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
      items: results.map(x => projectPrismaToCrud(x)),
      is_paginated: false,
    } as const;
  }
}));
