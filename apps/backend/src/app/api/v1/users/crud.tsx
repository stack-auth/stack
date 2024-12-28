import { ensureTeamMembershipExists, ensureUserExists } from "@/lib/request-checks";
import { PrismaTransaction } from "@/lib/types";
import { sendTeamMembershipDeletedWebhook, sendUserCreatedWebhook, sendUserDeletedWebhook, sendUserUpdatedWebhook } from "@/lib/webhooks";
import { RawQuery, prismaClient, rawQuery, retryTransaction } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { runAsynchronouslyAndWaitUntil } from "@/utils/vercel";
import { BooleanTrue, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { UsersCrud, usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { userIdOrMeSchema, yupBoolean, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { validateBase64Image } from "@stackframe/stack-shared/dist/utils/base64";
import { decodeBase64 } from "@stackframe/stack-shared/dist/utils/bytes";
import { getNodeEnvironment } from "@stackframe/stack-shared/dist/utils/env";
import { StackAssertionError, StatusError, captureError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { hashPassword, isPasswordHashValid } from "@stackframe/stack-shared/dist/utils/hashes";
import { deepPlainEquals } from "@stackframe/stack-shared/dist/utils/objects";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { teamPrismaToCrud, teamsCrudHandlers } from "../teams/crud";

export const userFullInclude = {
  projectUserOAuthAccounts: {
    include: {
      providerConfig: true,
    },
  },
  authMethods: {
    include: {
      passwordAuthMethod: true,
      otpAuthMethod: true,
      oauthAuthMethod: true,
      passkeyAuthMethod: true,
    }
  },
  contactChannels: true,
  teamMembers: {
    include: {
      team: true,
    },
    where: {
      isSelected: BooleanTrue.TRUE,
    },
  },
} satisfies Prisma.ProjectUserInclude;

export const oauthProviderConfigToCrud = (
  config: Prisma.OAuthProviderConfigGetPayload<{ include: {
    proxiedOAuthConfig: true,
    standardOAuthConfig: true,
  }, }>
) => {
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

export const userPrismaToCrud = (
  prisma: Prisma.ProjectUserGetPayload<{ include: typeof userFullInclude }>,
  lastActiveAtMillis: number,
): UsersCrud["Admin"]["Read"] => {
  const selectedTeamMembers = prisma.teamMembers;
  if (selectedTeamMembers.length > 1) {
    throw new StackAssertionError("User cannot have more than one selected team; this should never happen");
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const primaryEmailContactChannel = prisma.contactChannels.find((c) => c.type === 'EMAIL' && c.isPrimary);
  const passwordAuth = prisma.authMethods.find((m) => m.passwordAuthMethod);
  const otpAuth = prisma.authMethods.find((m) => m.otpAuthMethod);
  const passkeyAuth = prisma.authMethods.find((m) => m.passkeyAuthMethod);

  return {
    id: prisma.projectUserId,
    display_name: prisma.displayName || null,
    primary_email: primaryEmailContactChannel?.value || null,
    primary_email_verified: !!primaryEmailContactChannel?.isVerified,
    primary_email_auth_enabled: !!primaryEmailContactChannel?.usedForAuth,
    profile_image_url: prisma.profileImageUrl,
    signed_up_at_millis: prisma.createdAt.getTime(),
    client_metadata: prisma.clientMetadata,
    client_read_only_metadata: prisma.clientReadOnlyMetadata,
    server_metadata: prisma.serverMetadata,
    has_password: !!passwordAuth,
    otp_auth_enabled: !!otpAuth,
    auth_with_email: !!passwordAuth || !!otpAuth,
    requires_totp_mfa: prisma.requiresTotpMfa,
    passkey_auth_enabled: !!passkeyAuth,
    oauth_providers: prisma.projectUserOAuthAccounts.map((a) => ({
      id: a.oauthProviderConfigId,
      account_id: a.providerAccountId,
      email: a.email,
    })),
    selected_team_id: selectedTeamMembers[0]?.teamId ?? null,
    selected_team: selectedTeamMembers[0] ? teamPrismaToCrud(selectedTeamMembers[0]?.team) : null,
    last_active_at_millis: lastActiveAtMillis,
  };
};

async function getPasswordHashFromData(data: {
  password?: string | null,
  password_hash?: string,
}) {
  if (data.password !== undefined) {
    if (data.password_hash !== undefined) {
      throw new StatusError(400, "Cannot set both password and password_hash at the same time.");
    }
    if (data.password === null) {
      return null;
    }
    return await hashPassword(data.password);
  } else if (data.password_hash !== undefined) {
    if (!await isPasswordHashValid(data.password_hash)) {
      throw new StatusError(400, "Invalid password hash. Make sure it's a supported algorithm in Modular Crypt Format.");
    }
    return data.password_hash;
  } else {
    return undefined;
  }
}

async function checkAuthData(
  tx: PrismaTransaction,
  data: {
    projectId: string,
    oldPrimaryEmail?: string | null,
    primaryEmail?: string | null,
    primaryEmailVerified?: boolean,
    primaryEmailAuthEnabled?: boolean,
  }
) {
  if (!data.primaryEmail && data.primaryEmailAuthEnabled) {
    throw new StatusError(400, "primary_email_auth_enabled cannot be true without primary_email");
  }
  if (!data.primaryEmail && data.primaryEmailVerified) {
    throw new StatusError(400, "primary_email_verified cannot be true without primary_email");
  }
  if (data.primaryEmailAuthEnabled) {
    if (!data.oldPrimaryEmail || data.oldPrimaryEmail !== data.primaryEmail) {
      const existingChannelUsedForAuth = await tx.contactChannel.findFirst({
        where: {
          projectId: data.projectId,
          type: 'EMAIL',
          value: data.primaryEmail || throwErr("primary_email_auth_enabled is true but primary_email is not set"),
          usedForAuth: BooleanTrue.TRUE,
        }
      });

      if (existingChannelUsedForAuth) {
        throw new KnownErrors.UserEmailAlreadyExists();
      }
    }
  }
}

// TODO: retrieve in the project
async function getPasswordConfig(tx: PrismaTransaction, projectConfigId: string) {
  const passwordConfig = await tx.passwordAuthMethodConfig.findMany({
    where: {
      projectConfigId: projectConfigId,
      authMethodConfig: {
        enabled: true,
      }
    },
    include: {
      authMethodConfig: true,
    }
  });

  if (passwordConfig.length > 1) {
    throw new StackAssertionError("Multiple password auth methods found in the project", passwordConfig);
  }

  return passwordConfig.length === 0 ? null : passwordConfig[0];
}

// TODO: retrieve in the project
async function getOtpConfig(tx: PrismaTransaction, projectConfigId: string) {
  const otpConfig = await tx.otpAuthMethodConfig.findMany({
    where: {
      projectConfigId: projectConfigId,
      authMethodConfig: {
        enabled: true,
      }
    },
    include: {
      authMethodConfig: true,
    }
  });

  if (otpConfig.length > 1) {
    throw new StackAssertionError("Multiple OTP auth methods found in the project", otpConfig);
  }

  return otpConfig.length === 0 ? null : otpConfig[0];
}

export const getUserLastActiveAtMillis = async (projectId: string, userId: string): Promise<number | null> => {
  const res = (await getUsersLastActiveAtMillis(projectId, [userId], [0]))[0];
  if (res === 0) {
    return null;
  }
  return res;
};

// same as userIds.map(userId => getUserLastActiveAtMillis(projectId, userId)), but uses a single query
export const getUsersLastActiveAtMillis = async (projectId: string, userIds: string[], userSignedUpAtMillis: (number | Date)[]): Promise<number[]> => {
  if (userIds.length === 0) {
    // Prisma.join throws an error if the array is empty, so we need to handle that case
    return [];
  }

  const events = await prismaClient.$queryRaw<Array<{ userId: string, lastActiveAt: Date }>>`
    SELECT data->>'userId' as "userId", MAX("eventStartedAt") as "lastActiveAt"
    FROM "Event"
    WHERE data->>'userId' = ANY(${Prisma.sql`ARRAY[${Prisma.join(userIds)}]`}) AND data->>'projectId' = ${projectId} AND "systemEventTypeIds" @> '{"$user-activity"}'
    GROUP BY data->>'userId'
  `;

  return userIds.map((userId, index) => {
    const event = events.find(e => e.userId === userId);
    return event ? event.lastActiveAt.getTime() : (
      typeof userSignedUpAtMillis[index] === "number" ? (userSignedUpAtMillis[index] as number) : (userSignedUpAtMillis[index] as Date).getTime()
    );
  });
};

export function getUserQuery(projectId: string, userId: string): RawQuery<UsersCrud["Admin"]["Read"] | null> {
  return {
    sql: Prisma.sql`
      SELECT to_json(
        (
          SELECT (
            to_jsonb("ProjectUser".*) ||
            jsonb_build_object(
              'lastActiveAt', (
                SELECT MAX("eventStartedAt") as "lastActiveAt"
                FROM "Event"
                WHERE data->>'projectId' = "ProjectUser"."projectId" AND "data"->>'userId' = ("ProjectUser"."projectUserId")::text AND "systemEventTypeIds" @> '{"$user-activity"}'
              ),
              'ContactChannels', (
                SELECT COALESCE(ARRAY_AGG(
                  to_jsonb("ContactChannel") ||
                  jsonb_build_object()
                ), '{}')
                FROM "ContactChannel"
                WHERE "ContactChannel"."projectId" = "ProjectUser"."projectId" AND "ContactChannel"."projectUserId" = "ProjectUser"."projectUserId" AND "ContactChannel"."isPrimary" = 'TRUE'
              ),
              'ProjectUserOAuthAccounts', (
                SELECT COALESCE(ARRAY_AGG(
                  to_jsonb("ProjectUserOAuthAccount") ||
                  jsonb_build_object(
                    'ProviderConfig', (
                      SELECT to_jsonb("OAuthProviderConfig")
                      FROM "OAuthProviderConfig"
                      WHERE "ProjectConfig"."id" = "OAuthProviderConfig"."projectConfigId" AND "OAuthProviderConfig"."id" = "ProjectUserOAuthAccount"."oauthProviderConfigId"
                    )
                  )
                ), '{}')
                FROM "ProjectUserOAuthAccount"
                WHERE "ProjectUserOAuthAccount"."projectId" = "ProjectUser"."projectId" AND "ProjectUserOAuthAccount"."projectUserId" = "ProjectUser"."projectUserId"
              ),
              'AuthMethods', (
                SELECT COALESCE(ARRAY_AGG(
                  to_jsonb("AuthMethod") ||
                  jsonb_build_object(
                    'PasswordAuthMethod', (
                      SELECT (
                        to_jsonb("PasswordAuthMethod") ||
                        jsonb_build_object()
                      )
                      FROM "PasswordAuthMethod"
                      WHERE "PasswordAuthMethod"."projectId" = "ProjectUser"."projectId" AND "PasswordAuthMethod"."projectUserId" = "ProjectUser"."projectUserId" AND "PasswordAuthMethod"."authMethodId" = "AuthMethod"."id"
                    ),
                    'OtpAuthMethod', (
                      SELECT (
                        to_jsonb("OtpAuthMethod") ||
                        jsonb_build_object()
                      )
                      FROM "OtpAuthMethod"
                      WHERE "OtpAuthMethod"."projectId" = "ProjectUser"."projectId" AND "OtpAuthMethod"."projectUserId" = "ProjectUser"."projectUserId" AND "OtpAuthMethod"."authMethodId" = "AuthMethod"."id"
                    ),
                    'PasskeyAuthMethod', (
                      SELECT (
                        to_jsonb("PasskeyAuthMethod") ||
                        jsonb_build_object()
                      )
                      FROM "PasskeyAuthMethod"
                      WHERE "PasskeyAuthMethod"."projectId" = "ProjectUser"."projectId" AND "PasskeyAuthMethod"."projectUserId" = "ProjectUser"."projectUserId" AND "PasskeyAuthMethod"."authMethodId" = "AuthMethod"."id"
                    ),
                    'OAuthAuthMethod', (
                      SELECT (
                        to_jsonb("OAuthAuthMethod") ||
                        jsonb_build_object()
                      )
                      FROM "OAuthAuthMethod"
                      WHERE "OAuthAuthMethod"."projectId" = "ProjectUser"."projectId" AND "OAuthAuthMethod"."projectUserId" = "ProjectUser"."projectUserId" AND "OAuthAuthMethod"."authMethodId" = "AuthMethod"."id"
                    )
                  )
                ), '{}')
                FROM "AuthMethod"
                WHERE "AuthMethod"."projectId" = "ProjectUser"."projectId" AND "AuthMethod"."projectUserId" = "ProjectUser"."projectUserId"
              ),
              'SelectedTeamMember', (
                SELECT (
                  to_jsonb("TeamMember") ||
                  jsonb_build_object(
                    'Team', (
                      SELECT (
                        to_jsonb("Team") ||
                        jsonb_build_object()
                      )
                      FROM "Team"
                      WHERE "Team"."projectId" = "ProjectUser"."projectId" AND "Team"."teamId" = "TeamMember"."teamId"
                    )
                  )
                )
                FROM "TeamMember"
                WHERE "TeamMember"."projectId" = "ProjectUser"."projectId" AND "TeamMember"."projectUserId" = "ProjectUser"."projectUserId" AND "TeamMember"."isSelected" = 'TRUE'
              )
            )
          )
          FROM "ProjectUser"
          LEFT JOIN "Project" ON "Project"."id" = "ProjectUser"."projectId"
          LEFT JOIN "ProjectConfig" ON "ProjectConfig"."id" = "Project"."configId"
          WHERE "ProjectUser"."projectId" = ${projectId} AND "ProjectUser"."projectUserId" = ${userId}::UUID
        )
      ) AS "row_data_json"
    `,
    postProcess: (queryResult) => {
      if (queryResult.length !== 1) {
        throw new StackAssertionError(`Expected 1 user with id ${userId} in project ${projectId}, got ${queryResult.length}`, { queryResult });
      }

      const row = queryResult[0].row_data_json;
      if (!row) {
        return null;
      }

      const primaryEmailContactChannel = row.ContactChannels.find((c: any) => c.type === 'EMAIL' && c.isPrimary);
      const passwordAuth = row.AuthMethods.find((m: any) => m.PasswordAuthMethod);
      const otpAuth = row.AuthMethods.find((m: any) => m.OtpAuthMethod);
      const passkeyAuth = row.AuthMethods.find((m: any) => m.PasskeyAuthMethod);

      if (row.SelectedTeamMember && !row.SelectedTeamMember.Team) {
        // This seems to happen in production much more often than it should, so let's log some information for debugging
        captureError("selected-team-member-and-team-consistency", new StackAssertionError("Selected team member has no team? Ignoring it", { row }));
        row.SelectedTeamMember = null;
      }

      return {
        id: row.projectUserId,
        display_name: row.displayName || null,
        primary_email: primaryEmailContactChannel?.value || null,
        primary_email_verified: primaryEmailContactChannel?.isVerified || false,
        primary_email_auth_enabled: primaryEmailContactChannel?.usedForAuth === 'TRUE' ? true : false,
        profile_image_url: row.profileImageUrl,
        signed_up_at_millis: new Date(row.createdAt + "Z").getTime(),
        client_metadata: row.clientMetadata,
        client_read_only_metadata: row.clientReadOnlyMetadata,
        server_metadata: row.serverMetadata,
        has_password: !!passwordAuth,
        otp_auth_enabled: !!otpAuth,
        auth_with_email: !!passwordAuth || !!otpAuth,
        requires_totp_mfa: row.requiresTotpMfa,
        passkey_auth_enabled: !!passkeyAuth,
        oauth_providers: row.ProjectUserOAuthAccounts.map((a: any) => ({
          id: a.oauthProviderConfigId,
          account_id: a.providerAccountId,
          email: a.email,
        })),
        selected_team_id: row.SelectedTeamMember?.teamId ?? null,
        selected_team: row.SelectedTeamMember ? {
          id: row.SelectedTeamMember.Team.teamId,
          display_name: row.SelectedTeamMember.Team.displayName,
          profile_image_url: row.SelectedTeamMember.Team.profileImageUrl,
          created_at_millis: new Date(row.SelectedTeamMember.Team.createdAt + "Z").getTime(),
          client_metadata: row.SelectedTeamMember.Team.clientMetadata,
          client_read_only_metadata: row.SelectedTeamMember.Team.clientReadOnlyMetadata,
          server_metadata: row.SelectedTeamMember.Team.serverMetadata,
        } : null,
        last_active_at_millis: row.lastActiveAt ? new Date(row.lastActiveAt + "Z").getTime() : new Date(row.createdAt + "Z").getTime(),
      };
    },
  };
}

export async function getUser(options: { projectId: string, userId: string }) {
  const result = await rawQuery(getUserQuery(options.projectId, options.userId));

  // In non-prod environments, let's also call the legacy function and ensure the result is the same
  // TODO next-release: remove this
  if (!getNodeEnvironment().includes("prod")) {
    const legacyResult = await getUserLegacy(options);
    if (!deepPlainEquals(result, legacyResult)) {
      throw new StackAssertionError("User result mismatch", {
        result,
        legacyResult,
      });
    }
  }

  return result;
}

async function getUserLegacy(options: { projectId: string, userId: string }) {
  const [db, lastActiveAtMillis] = await Promise.all([
    prismaClient.projectUser.findUnique({
      where: {
        projectId_projectUserId: {
          projectId: options.projectId,
          projectUserId: options.userId,
        },
      },
      include: userFullInclude,
    }),
    getUserLastActiveAtMillis(options.projectId, options.userId),
  ]);

  if (!db) {
    return null;
  }

  return userPrismaToCrud(db, lastActiveAtMillis ?? db.createdAt.getTime());
}

export const usersCrudHandlers = createLazyProxy(() => createCrudHandlers(usersCrud, {
  paramsSchema: yupObject({
    user_id: userIdOrMeSchema.defined(),
  }),
  querySchema: yupObject({
    team_id: yupString().uuid().optional().meta({ openapiField: { onlyShowInOperations: [ 'List' ], description: "Only return users who are members of the given team" } }),
    limit: yupNumber().integer().min(1).optional().meta({ openapiField: { onlyShowInOperations: [ 'List' ], description: "The maximum number of items to return" } }),
    cursor: yupString().uuid().optional().meta({ openapiField: { onlyShowInOperations: [ 'List' ], description: "The cursor to start the result set from." } }),
    order_by: yupString().oneOf(['signed_up_at']).optional().meta({ openapiField: { onlyShowInOperations: [ 'List' ], description: "The field to sort the results by. Defaults to signed_up_at" } }),
    desc: yupBoolean().optional().meta({ openapiField: { onlyShowInOperations: [ 'List' ], description: "Whether to sort the results in descending order. Defaults to false" } }),
    query: yupString().optional().meta({ openapiField: { onlyShowInOperations: [ 'List' ], description: "A search query to filter the results by. This is a free-text search that is applied to the user's display name and primary email." } }),
  }),
  onRead: async ({ auth, params }) => {
    const user = await getUser({ projectId: auth.project.id, userId: params.user_id });
    if (!user) {
      throw new KnownErrors.UserNotFound();
    }
    return user;
  },
  onList: async ({ auth, query }) => {
    const where = {
      projectId: auth.project.id,
      ...query.team_id ? {
        teamMembers: {
          some: {
            teamId: query.team_id,
          },
        },
      } : {},
      ...query.query ? {
        OR: [
          {
            displayName: {
              contains: query.query,
              mode: 'insensitive',
            },
          },
          {
            contactChannels: {
              some: {
                value: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
            },
          },
        ] as any,
      } : {},
    };

    const db = await prismaClient.projectUser.findMany({
      where,
      include: userFullInclude,
      orderBy: {
        [({
          signed_up_at: 'createdAt',
        } as const)[query.order_by ?? 'signed_up_at']]: query.desc ? 'desc' : 'asc',
      },
      // +1 because we need to know if there is a next page
      take: query.limit ? query.limit + 1 : undefined,
      ...query.cursor ? {
        cursor: {
          projectId_projectUserId: {
            projectId: auth.project.id,
            projectUserId: query.cursor,
          },
        },
      } : {},
    });

    const lastActiveAtMillis = await getUsersLastActiveAtMillis(auth.project.id, db.map(user => user.projectUserId), db.map(user => user.createdAt));
    return {
      // remove the last item because it's the next cursor
      items: db.map((user, index) => userPrismaToCrud(user, lastActiveAtMillis[index])).slice(0, query.limit),
      is_paginated: true,
      pagination: {
        // if result is not full length, there is no next cursor
        next_cursor: query.limit && db.length >= query.limit + 1 ? db[db.length - 1].projectUserId : null,
      },
    };
  },
  onCreate: async ({ auth, data }) => {
    const result = await retryTransaction(async (tx) => {
      const passwordHash = await getPasswordHashFromData(data);
      await checkAuthData(tx, {
        projectId: auth.project.id,
        primaryEmail: data.primary_email,
        primaryEmailVerified: data.primary_email_verified,
        primaryEmailAuthEnabled: data.primary_email_auth_enabled,
      });

      const newUser = await tx.projectUser.create({
        data: {
          projectId: auth.project.id,
          displayName: data.display_name === undefined ? undefined : (data.display_name || null),
          clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
          clientReadOnlyMetadata: data.client_read_only_metadata === null ? Prisma.JsonNull : data.client_read_only_metadata,
          serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
          profileImageUrl: data.profile_image_url,
          totpSecret: data.totp_secret_base64 == null ? data.totp_secret_base64 : Buffer.from(decodeBase64(data.totp_secret_base64)),
        },
        include: userFullInclude,
      });

      if (data.oauth_providers) {
        // TODO: include this in the project
        const authMethodConfigs = await tx.authMethodConfig.findMany({
          where: {
            projectConfigId: auth.project.config.id,
            oauthProviderConfig: {
              isNot: null,
            }
          },
          include: {
            oauthProviderConfig: true,
          }
        });
        const connectedAccountConfigs = await tx.connectedAccountConfig.findMany({
          where: {
            projectConfigId: auth.project.config.id,
            oauthProviderConfig: {
              isNot: null,
            }
          },
          include: {
            oauthProviderConfig: true,
          }
        });

        // create many does not support nested create, so we have to use loop
        for (const provider of data.oauth_providers) {
          const connectedAccountConfig = connectedAccountConfigs.find((c) => c.oauthProviderConfig?.id === provider.id);
          const authMethodConfig = authMethodConfigs.find((c) => c.oauthProviderConfig?.id === provider.id);

          let authMethod;
          if (authMethodConfig) {
            authMethod = await tx.authMethod.create({
              data: {
                projectId: auth.project.id,
                projectUserId: newUser.projectUserId,
                projectConfigId: auth.project.config.id,
                authMethodConfigId: authMethodConfig.id,
              }
            });
          }

          await tx.projectUserOAuthAccount.create({
            data: {
              projectId: auth.project.id,
              projectUserId: newUser.projectUserId,
              projectConfigId: auth.project.config.id,
              oauthProviderConfigId: provider.id,
              providerAccountId: provider.account_id,
              email: provider.email,
              ...connectedAccountConfig ? {
                connectedAccount: {
                  create: {
                    connectedAccountConfigId: connectedAccountConfig.id,
                    projectUserId: newUser.projectUserId,
                    projectConfigId: auth.project.config.id,
                  }
                }
              } : {},
              ...authMethodConfig ? {
                oauthAuthMethod: {
                  create: {
                    projectUserId: newUser.projectUserId,
                    projectConfigId: auth.project.config.id,
                    authMethodId: authMethod?.id || throwErr("authMethodConfig is set but authMethod is not"),
                  }
                }
              } : {},
            }
          });
        }

      }

      if (data.primary_email) {
        await tx.contactChannel.create({
          data: {
            projectUserId: newUser.projectUserId,
            projectId: auth.project.id,
            type: 'EMAIL' as const,
            value: data.primary_email,
            isVerified: data.primary_email_verified ?? false,
            isPrimary: "TRUE",
            usedForAuth: data.primary_email_auth_enabled ? BooleanTrue.TRUE : null,
          }
        });
      }

      if (passwordHash) {
        const passwordConfig = await getPasswordConfig(tx, auth.project.config.id);

        if (!passwordConfig) {
          throw new StatusError(StatusError.BadRequest, "Password auth not enabled in the project");
        }

        await tx.authMethod.create({
          data: {
            projectId: auth.project.id,
            projectConfigId: auth.project.config.id,
            projectUserId: newUser.projectUserId,
            authMethodConfigId: passwordConfig.authMethodConfigId,
            passwordAuthMethod: {
              create: {
                passwordHash,
                projectUserId: newUser.projectUserId,
              }
            }
          }
        });
      }

      if (data.otp_auth_enabled) {
        const otpConfig = await getOtpConfig(tx, auth.project.config.id);

        if (!otpConfig) {
          throw new StatusError(StatusError.BadRequest, "OTP auth not enabled in the project");
        }

        await tx.authMethod.create({
          data: {
            projectId: auth.project.id,
            projectConfigId: auth.project.config.id,
            projectUserId: newUser.projectUserId,
            authMethodConfigId: otpConfig.authMethodConfigId,
            otpAuthMethod: {
              create: {
                projectUserId: newUser.projectUserId,
              }
            }
          }
        });
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

      return userPrismaToCrud(user, await getUserLastActiveAtMillis(auth.project.id, user.projectUserId) ?? user.createdAt.getTime());
    });

    if (auth.project.config.create_team_on_sign_up) {
      await teamsCrudHandlers.adminCreate({
        data: {
          display_name: data.display_name ?
            `${data.display_name}'s Team` :
            data.primary_email ?
              `${data.primary_email}'s Team` :
              "Personal Team",
          creator_user_id: 'me',
        },
        project: auth.project,
        user: result,
      });
    }

    runAsynchronouslyAndWaitUntil(sendUserCreatedWebhook({
      projectId: auth.project.id,
      data: result,
    }));

    return result;
  },
  onUpdate: async ({ auth, data, params }) => {
    const passwordHash = await getPasswordHashFromData(data);
    const result = await retryTransaction(async (tx) => {
      await ensureUserExists(tx, { projectId: auth.project.id, userId: params.user_id });

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

      const oldUser = await tx.projectUser.findUnique({
        where: {
          projectId_projectUserId: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
        },
        include: userFullInclude,
      });

      if (!oldUser) {
        throw new StackAssertionError("User not found");
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const primaryEmailContactChannel = oldUser.contactChannels.find((c) => c.type === 'EMAIL' && c.isPrimary);
      const otpAuth = oldUser.authMethods.find((m) => m.otpAuthMethod)?.otpAuthMethod;
      const passwordAuth = oldUser.authMethods.find((m) => m.passwordAuthMethod)?.passwordAuthMethod;
      const passkeyAuth = oldUser.authMethods.find((m) => m.passkeyAuthMethod)?.passkeyAuthMethod;

      await checkAuthData(tx, {
        projectId: auth.project.id,
        oldPrimaryEmail: primaryEmailContactChannel?.value,
        primaryEmail: data.primary_email || primaryEmailContactChannel?.value,
        primaryEmailVerified: data.primary_email_verified || primaryEmailContactChannel?.isVerified,
        primaryEmailAuthEnabled: data.primary_email_auth_enabled || !!primaryEmailContactChannel?.usedForAuth,
      });

      // if there is a new primary email
      // - create a new primary email contact channel if it doesn't exist
      // - update the primary email contact channel if it exists
      // if the primary email is null
      // - delete the primary email contact channel if it exists (note that this will also delete the related auth methods)
      if (data.primary_email !== undefined) {
        if (data.primary_email === null) {
          await tx.contactChannel.delete({
            where: {
              projectId_projectUserId_type_isPrimary: {
                projectId: auth.project.id,
                projectUserId: params.user_id,
                type: 'EMAIL',
                isPrimary: "TRUE",
              },
            },
          });
        } else {
          await tx.contactChannel.upsert({
            where: {
              projectId_projectUserId_type_isPrimary: {
                projectId: auth.project.id,
                projectUserId: params.user_id,
                type: 'EMAIL',
                isPrimary: "TRUE",
              },
            },
            create: {
              projectUserId: params.user_id,
              projectId: auth.project.id,
              type: 'EMAIL' as const,
              value: data.primary_email,
              isVerified: false,
              isPrimary: "TRUE",
            },
            update: {
              value: data.primary_email,
              usedForAuth: data.primary_email_auth_enabled === undefined ? undefined : (data.primary_email_auth_enabled ? BooleanTrue.TRUE : null),
            }
          });
        }
      }

      // if there is a new primary email verified
      // - update the primary email contact channel if it exists
      if (data.primary_email_verified !== undefined) {
        await tx.contactChannel.update({
          where: {
            projectId_projectUserId_type_isPrimary: {
              projectId: auth.project.id,
              projectUserId: params.user_id,
              type: 'EMAIL',
              isPrimary: "TRUE",
            },
          },
          data: {
            isVerified: data.primary_email_verified,
          },
        });
      }

      // if otp_auth_enabled is true
      // - create a new otp auth method if it doesn't exist
      // if otp_auth_enabled is false
      // - delete the otp auth method if it exists
      if (data.otp_auth_enabled !== undefined) {
        if (data.otp_auth_enabled) {
          if (!otpAuth) {
            const otpConfig = await getOtpConfig(tx, auth.project.config.id);

            if (otpConfig) {
              await tx.authMethod.create({
                data: {
                  projectId: auth.project.id,
                  projectConfigId: auth.project.config.id,
                  projectUserId: params.user_id,
                  authMethodConfigId: otpConfig.authMethodConfigId,
                  otpAuthMethod: {
                    create: {
                      projectUserId: params.user_id,
                    }
                  }
                }
              });
            }
          }
        } else {
          if (otpAuth) {
            await tx.authMethod.delete({
              where: {
                projectId_id: {
                  projectId: auth.project.id,
                  id: otpAuth.authMethodId,
                },
              },
            });
          }
        }
      }


      // Hacky passkey auth method crud, should be replaced by authHandler endpoints in the future
      if (data.passkey_auth_enabled !== undefined) {
        if (data.passkey_auth_enabled) {
          throw new StatusError(StatusError.BadRequest, "Cannot manually enable passkey auth, it is enabled iff there is a passkey auth method");
          // Case: passkey_auth_enabled is set to true. This should only happen after a user added a passkey and is a no-op since passkey_auth_enabled is true iff there is a passkey auth method.
          // Here to update the ui for the settings page.
          // The passkey auth method is created in the registerPasskey endpoint!
        } else {
          // Case: passkey_auth_enabled is set to false. This is how we delete the passkey auth method.
          if (passkeyAuth) {
            await tx.authMethod.delete({
              where: {
                projectId_id: {
                  projectId: auth.project.id,
                  id: passkeyAuth.authMethodId,
                },
              },
            });
          }
        }
      }

      // if there is a new password
      // - update the password auth method if it exists
      // if the password is null
      // - delete the password auth method if it exists
      if (passwordHash !== undefined) {
        if (passwordHash === null) {
          if (passwordAuth) {
            await tx.authMethod.delete({
              where: {
                projectId_id: {
                  projectId: auth.project.id,
                  id: passwordAuth.authMethodId,
                },
              },
            });
          }
        } else {
          if (passwordAuth) {
            await tx.passwordAuthMethod.update({
              where: {
                projectId_authMethodId: {
                  projectId: auth.project.id,
                  authMethodId: passwordAuth.authMethodId,
                },
              },
              data: {
                passwordHash,
              },
            });
          } else {
            const primaryEmailChannel = await tx.contactChannel.findFirst({
              where: {
                projectId: auth.project.id,
                projectUserId: params.user_id,
                type: 'EMAIL',
                isPrimary: "TRUE",
              }
            });

            if (!primaryEmailChannel) {
              throw new StackAssertionError("password is set but primary_email is not set");
            }

            const passwordConfig = await getPasswordConfig(tx, auth.project.config.id);

            if (!passwordConfig) {
              throw new StatusError(StatusError.BadRequest, "Password auth not enabled in the project");
            }

            await tx.authMethod.create({
              data: {
                projectId: auth.project.id,
                projectConfigId: auth.project.config.id,
                projectUserId: params.user_id,
                authMethodConfigId: passwordConfig.authMethodConfigId,
                passwordAuthMethod: {
                  create: {
                    passwordHash,
                    projectUserId: params.user_id,
                  }
                }
              }
            });
          }
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
          profileImageUrl: data.profile_image_url,
          requiresTotpMfa: data.totp_secret_base64 === undefined ? undefined : (data.totp_secret_base64 !== null),
          totpSecret: data.totp_secret_base64 == null ? data.totp_secret_base64 : Buffer.from(decodeBase64(data.totp_secret_base64)),
        },
        include: userFullInclude,
      });

      // if user password changed, reset all refresh tokens
      if (passwordHash !== undefined) {
        await prismaClient.projectUserRefreshToken.deleteMany({
          where: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
        });
      }

      return userPrismaToCrud(db, await getUserLastActiveAtMillis(auth.project.id, params.user_id) ?? db.createdAt.getTime());
    });


    runAsynchronouslyAndWaitUntil(sendUserUpdatedWebhook({
      projectId: auth.project.id,
      data: result,
    }));

    return result;
  },
  onDelete: async ({ auth, params }) => {
    const { teams } = await retryTransaction(async (tx) => {
      await ensureUserExists(tx, { projectId: auth.project.id, userId: params.user_id });

      const teams = await tx.team.findMany({
        where: {
          projectId: auth.project.id,
          teamMembers: {
            some: {
              projectUserId: params.user_id,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      await tx.projectUser.delete({
        where: {
          projectId_projectUserId: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
        },
        include: userFullInclude,
      });

      return { teams };
    });

    runAsynchronouslyAndWaitUntil(Promise.all(teams.map(t => sendTeamMembershipDeletedWebhook({
      projectId: auth.project.id,
      data: {
        team_id: t.teamId,
        user_id: params.user_id,
      },
    }))));

    runAsynchronouslyAndWaitUntil(sendUserDeletedWebhook({
      projectId: auth.project.id,
      data: {
        id: params.user_id,
        teams: teams.map((t) => ({
          id: t.teamId,
        })),
      },
    }));
  }
}));

export const currentUserCrudHandlers = createLazyProxy(() => createCrudHandlers(currentUserCrud, {
  paramsSchema: yupObject({} as const),
  async onRead({ auth }) {
    if (!auth.user) {
      throw new KnownErrors.CannotGetOwnUserWithoutUser();
    }
    return auth.user;
  },
  async onUpdate({ auth, data }) {
    if (auth.type === 'client' && data.profile_image_url && !validateBase64Image(data.profile_image_url)) {
      throw new StatusError(400, "Invalid profile image URL");
    }

    return await usersCrudHandlers.adminUpdate({
      project: auth.project,
      user_id: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
      data,
      allowedErrorTypes: [StatusError],
    });
  },
  async onDelete({ auth }) {
    if (auth.type === 'client' && !auth.project.config.client_user_deletion_enabled) {
      throw new StatusError(StatusError.BadRequest, "Client user deletion is not enabled for this project");
    }

    return await usersCrudHandlers.adminDelete({
      project: auth.project,
      user_id: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
      allowedErrorTypes: [StatusError]
    });
  },
}));
