import { fullProjectInclude, listManagedProjectIds, projectPrismaToCrud } from "@/lib/projects";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { internalProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { projectIdSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";

export const internalProjectsCrudHandlers = createCrudHandlers(internalProjectsCrud, {
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
});
