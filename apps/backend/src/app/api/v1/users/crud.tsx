import { ensureTeamMembershipExists, ensureUserExist } from "@/lib/request-checks";
import { sendUserCreatedWebhook, sendUserDeletedWebhook, sendUserUpdatedWebhook } from "@/lib/webhooks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { BooleanTrue, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { UsersCrud, usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { decodeBase64 } from "@stackframe/stack-shared/dist/utils/bytes";
import { StackAssertionError, StatusError, captureError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { teamPrismaToCrud, teamsCrudHandlers } from "../teams/crud";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";

const oauthProviderConfigInclude = {
  proxiedOAuthConfig: true,
  standardOAuthConfig: true,
} as const;

export const userFullInclude = {
  projectUserOAuthAccounts: {
    include: {
      providerConfig: true,
    },
  },
  contactChannels: true,
  authMethods: {
    include: {
      passwordAuthMethod: true,
      oauthAuthMethod: {
        include: {
          oauthProviderConfig: {
            include: oauthProviderConfigInclude,
          }
        }
      },
      otpAuthMethod: {
        include: {
          contactChannel: true,
        }
      }
    }
  },
  connectedAccounts: {
    include: {
      oauthProviderConfig: {
        include: oauthProviderConfigInclude,
      }
    }
  },
  teamMembers: {
    include: {
      team: true,
    },
    where: {
      isSelected: BooleanTrue.TRUE,
    },
  },
} satisfies Prisma.ProjectUserInclude;

export const contactChannelToCrud = (channel: Prisma.ContactChannelGetPayload<{}>) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (channel.type !== 'EMAIL') {
    throw new StackAssertionError("Only email channels are supported");
  }

  return {
    type: 'email',
    email: channel.value,
  };
};

export const oauthProviderConfigToCrud = (config: Prisma.OAuthProviderConfigGetPayload<{ include: typeof oauthProviderConfigInclude }>) => {
  let type;
  if (config.proxiedOAuthConfig) {
    type = config.proxiedOAuthConfig.type;
  } else if (config.standardOAuthConfig) {
    type = config.standardOAuthConfig.type;
  } else {
    throw new StackAssertionError(`OAuthProviderConfig ${config.id} violates the union constraint`, config);
  }

  return {
    id: config.id,
    type: typedToLowercase(type),
  } as const;
};

export const userPrismaToCrud = (prisma: Prisma.ProjectUserGetPayload<{ include: typeof userFullInclude}>): UsersCrud["Admin"]["Read"] => {
  const selectedTeamMembers = prisma.teamMembers;
  if (selectedTeamMembers.length > 1) {
    throw new StackAssertionError("User cannot have more than one selected team; this should never happen");
  }

  const authMethods: UsersCrud["Admin"]["Read"]["auth_methods"] = prisma.authMethods.map((m) => {
    if ([m.passwordAuthMethod, m.otpAuthMethod, m.oauthAuthMethod].filter(Boolean).length > 1) {
      throw new StackAssertionError(`AuthMethod ${m.id} violates the union constraint`, m);
    }

    if (m.passwordAuthMethod) {
      return {
        type: 'password',
        identifier: m.passwordAuthMethod.identifier,
      };
    } else if (m.otpAuthMethod) {
      return {
        type: 'otp',
        contact_channel: {
          type: 'email',
          email: m.otpAuthMethod.contactChannel.value,
        },
      };
    } else if (m.oauthAuthMethod) {
      return {
        type: 'oauth',
        provider: {
          ...oauthProviderConfigToCrud(m.oauthAuthMethod.oauthProviderConfig),
          provider_user_id: m.oauthAuthMethod.providerAccountId,
        },
      };
    } else {
      throw new StackAssertionError("AuthMethod has no auth methods", m);
    }
  });

  const connectedAccounts: UsersCrud["Admin"]["Read"]["connected_accounts"] = prisma.connectedAccounts.map((a) => {
    return {
      type: 'oauth',
      provider: {
        ...oauthProviderConfigToCrud(a.oauthProviderConfig),
        provider_user_id: a.oauthAccountId,
      },
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const primaryEmailContactChannel = prisma.contactChannels.find((c) => c.type === 'EMAIL' && c.isPrimary);
  const passwordAuth = prisma.authMethods.find((m) => m.passwordAuthMethod);
  const otpAuth = prisma.authMethods.find((m) => m.otpAuthMethod);

  return {
    id: prisma.projectUserId,
    display_name: prisma.displayName || null,
    primary_email: primaryEmailContactChannel?.value || null,
    primary_email_verified: primaryEmailContactChannel?.isVerified || false,
    profile_image_url: prisma.profileImageUrl,
    signed_up_at_millis: prisma.createdAt.getTime(),
    client_metadata: prisma.clientMetadata,
    client_read_only_metadata: prisma.clientReadOnlyMetadata,
    server_metadata: prisma.serverMetadata,
    has_password: !!passwordAuth,
    auth_with_email: !!passwordAuth || !!otpAuth,
    requires_totp_mfa: prisma.requiresTotpMfa,
    oauth_providers: prisma.projectUserOAuthAccounts.map((a) => ({
      id: a.oauthProviderConfigId,
      account_id: a.providerAccountId,
      email: a.email,
    })),
    auth_methods: authMethods,
    connected_accounts: connectedAccounts,
    selected_team_id: selectedTeamMembers[0]?.teamId ?? null,
    selected_team: selectedTeamMembers[0] ? teamPrismaToCrud(selectedTeamMembers[0]?.team) : null,
  };
};

export const usersCrudHandlers = createLazyProxy(() => createCrudHandlers(usersCrud, {
  querySchema: yupObject({
    team_id: yupString().uuid().optional().meta({ openapiField: { onlyShowInOperations: [ 'List' ] }})
  }),
  paramsSchema: yupObject({
    user_id: userIdOrMeSchema.required(),
  }),
  onRead: async ({ auth, params }) => {
    const db = await prismaClient.projectUser.findUnique({
      where: {
        projectId_projectUserId: {
          projectId: auth.project.id,
          projectUserId: params.user_id,
        },
      },
      include: userFullInclude,
    });

    if (!db) {
      throw new KnownErrors.UserNotFound();
    }

    return userPrismaToCrud(db);
  },
  onList: async ({ auth, query }) => {
    const db = await prismaClient.projectUser.findMany({
      where: {
        projectId: auth.project.id,
        ...query.team_id ? {
          teamMembers: {
            some: {
              teamId: query.team_id,
            },
          },
        } : {},
      },
      include: userFullInclude,
    });

    return {
      items: db.map(userPrismaToCrud),
      is_paginated: false,
    };
  },
  onCreate: async ({ auth, data }) => {
    const result = await prismaClient.$transaction(async (tx) => {
      if (!data.primary_email && data.primary_email_auth_enabled) {
        throw new StatusError(400, "primary_email_auth_enabled cannot be true without primary_email");
      }
      if (!data.primary_email_auth_enabled && data.password) {
        throw new StatusError(400, "password cannot be set without primary_email_auth_enabled");
      }
      if (data.primary_email_auth_enabled) {
        const otp = await tx.otpAuthMethod.findFirst({
          where: {
            projectId: auth.project.id,
            contactChannel: {
              type: 'EMAIL',
              value: data.primary_email || throwErr("primary_email_auth_enabled is true but primary_email is not set"),
            },
          }
        });

        if (otp) {
          throw new KnownErrors.UserEmailAlreadyExists();
        }
      }

      const newUser = await tx.projectUser.create({
        data: {
          projectId: auth.project.id,
          displayName: data.display_name === undefined ? undefined : (data.display_name || null),
          clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
          clientReadOnlyMetadata: data.client_read_only_metadata === null ? Prisma.JsonNull : data.client_read_only_metadata,
          serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
          // primaryEmail: data.primary_email,
          // primaryEmailVerified: data.primary_email_verified ?? false,
          // authWithEmail: data.primary_email_auth_enabled ?? false,
          // passwordHash: data.password == null ? data.password : await hashPassword(data.password),
          profileImageUrl: data.profile_image_url,
          projectUserOAuthAccounts: data.oauth_providers ? {
            createMany: {
              data: data.oauth_providers.map((provider) => ({
                projectConfigId: auth.project.config.id,
                oauthProviderConfigId: provider.id,
                providerAccountId: provider.account_id,
                email: provider.email,
              }))
            }
          } : undefined,
          totpSecret: data.totp_secret_base64 == null ? data.totp_secret_base64 : Buffer.from(decodeBase64(data.totp_secret_base64)),
        },
        include: userFullInclude,
      });

      if (data.primary_email) {
        const contactChannel = await tx.contactChannel.create({
          data: {
            projectConfigId: auth.project.config.id,
            projectUserId: newUser.projectUserId,
            projectId: auth.project.id,
            type: 'EMAIL' as const,
            value: data.primary_email || throwErr("primary_email_auth_enabled is true but primary_email is not set"),
            isVerified: data.primary_email_verified ?? false,
          }
        });

        if (data.primary_email_auth_enabled) {
          await tx.authMethod.create({
            data: {
              projectId: auth.project.id,
              projectConfigId: auth.project.config.id,
              projectUserId: newUser.projectUserId,
              otpAuthMethod: {
                create: {
                  projectUserId: newUser.projectUserId,
                  contactChannelId: contactChannel.id,
                }
              }
            }
          });
        }

        if (data.password) {
          await tx.authMethod.create({
            data: {
              projectId: auth.project.id,
              projectConfigId: auth.project.config.id,
              projectUserId: newUser.projectUserId,
              passwordAuthMethod: {
                create: {
                  identifier: data.primary_email || throwErr("password is set but primary_email is not"),
                  passwordHash: await hashPassword(data.password),
                  type: 'EMAIL',
                  projectUserId: newUser.projectUserId,
                }
              }
            }
          });
        }
      }

      const user = await tx.projectUser.findUnique({
        where: {
          projectId_projectUserId: {
            projectId: auth.project.id,
            projectUserId: newUser.projectUserId,
          },
        },
        include: userFullInclude,
      });

      if (!user) {
        throw new StackAssertionError("User was created but not found", newUser);
      }

      return userPrismaToCrud(user);
    });


    if (auth.project.config.create_team_on_sign_up) {
      await teamsCrudHandlers.adminCreate({
        data: {
          display_name: data.display_name ?
            `${data.display_name}'s Team` :
            data.primary_email ?
              `${data.primary_email}'s Team` :
              "Personal Team"
        },
        query: {
          add_current_user: "true",
        },
        project: auth.project,
        user: result,
      });
    }


    await sendUserCreatedWebhook({
      projectId: auth.project.id,
      data: result,
    });

    return result;
  },
  onUpdate: async ({ auth, data, params }) => {
    const db = await prismaClient.$transaction(async (tx) => {
      await ensureUserExist(tx, { projectId: auth.project.id, userId: params.user_id });

      if (data.selected_team_id !== undefined) {
        if (data.selected_team_id !== null) {
          await ensureTeamMembershipExists(tx, {
            projectId: auth.project.id,
            teamId: data.selected_team_id,
            userId: params.user_id,
          });
        }

        await tx.teamMember.updateMany({
          where: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
          data: {
            isSelected: null,
          },
        });

        if (data.selected_team_id !== null) {
          await tx.teamMember.update({
            where: {
              projectId_projectUserId_teamId: {
                projectId: auth.project.id,
                projectUserId: params.user_id,
                teamId: data.selected_team_id,
              },
            },
            data: {
              isSelected: BooleanTrue.TRUE,
            },
          });
        }
      }

      const db = await tx.projectUser.update({
        where: {
          projectId_projectUserId: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
        },
        data: {
          displayName: data.display_name === undefined ? undefined : (data.display_name || null),
          clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
          clientReadOnlyMetadata: data.client_read_only_metadata === null ? Prisma.JsonNull : data.client_read_only_metadata,
          serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
          primaryEmail: data.primary_email,
          primaryEmailVerified: data.primary_email_verified ?? (data.primary_email !== undefined ? false : undefined),
          authWithEmail: data.primary_email_auth_enabled,
          passwordHash: data.password == null ? data.password : await hashPassword(data.password),
          profileImageUrl: data.profile_image_url,
          requiresTotpMfa: data.totp_secret_base64 === undefined ? undefined : (data.totp_secret_base64 !== null),
          totpSecret: data.totp_secret_base64 == null ? data.totp_secret_base64 : Buffer.from(decodeBase64(data.totp_secret_base64)),
        },
        include: userFullInclude,
      });

      return db;
    });

    const result = userPrismaToCrud(db);

    await sendUserUpdatedWebhook({
      projectId: auth.project.id,
      data: result,
    });

    return result;
  },
  onDelete: async ({ auth, params }) => {
    await prismaClient.$transaction(async (tx) => {
      await ensureUserExist(tx, { projectId: auth.project.id, userId: params.user_id });

      await tx.projectUser.delete({
        where: {
          projectId_projectUserId: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
        },
        include: userFullInclude,
      });
    });

    await sendUserDeletedWebhook({
      projectId: auth.project.id,
      data: {
        id: params.user_id,
      },
    });
  }
}));

export const currentUserCrudHandlers = createLazyProxy(() => createCrudHandlers(currentUserCrud, {
  paramsSchema: yupObject({} as const),
  async onRead({ auth }) {
    return await usersCrudHandlers.adminRead({
      project: auth.project,
      user_id: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
    });
  },
  async onUpdate({ auth, data }) {
    return await usersCrudHandlers.adminUpdate({
      project: auth.project,
      user_id: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
      data,
    });
  },
  async onDelete({ auth }) {
    return await usersCrudHandlers.adminDelete({
      project: auth.project,
      user_id: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
    });
  },
}));
