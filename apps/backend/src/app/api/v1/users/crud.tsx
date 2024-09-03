import { BooleanTrue, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { UsersCrud, usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { validateBase64Image } from "@stackframe/stack-shared/dist/utils/base64";
import { decodeBase64 } from "@stackframe/stack-shared/dist/utils/bytes";
import { StackAssertionError, StatusError, captureError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { ensureTeamMembershipExists, ensureUserExist } from "@/lib/request-checks";
import { sendUserCreatedWebhook, sendUserDeletedWebhook, sendUserUpdatedWebhook } from "@/lib/webhooks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { teamPrismaToCrud, teamsCrudHandlers } from "../teams/crud";

export const userFullInclude = {
  projectUserOAuthAccounts: {
    include: {
      providerConfig: true,
    },
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

export const userPrismaToCrud = (
  prisma: Prisma.ProjectUserGetPayload<{ include: typeof userFullInclude }>,
  lastActiveAtMillis: number,
): UsersCrud["Admin"]["Read"] => {
  const selectedTeamMembers = prisma.teamMembers;
  if (selectedTeamMembers.length > 1) {
    throw new StackAssertionError("User cannot have more than one selected team; this should never happen");
  }

  if (prisma.passwordHash && !prisma.authWithEmail) {
    captureError(
      "prismaToCrud",
      new StackAssertionError("User has password but authWithEmail is false; this is an assertion error that should never happen", {
        prisma,
      }),
    );
  }
  if (prisma.authWithEmail && !prisma.primaryEmail) {
    captureError(
      "prismaToCrud",
      new StackAssertionError("User has authWithEmail but no primary email; this is an assertion error that should never happen", {
        prisma,
      }),
    );
  }
  const authMethods: UsersCrud["Admin"]["Read"]["auth_methods"] = [
    ...(prisma.authWithEmail && prisma.passwordHash
      ? ([
          {
            type: "password",
            identifier: prisma.primaryEmail ?? "",
          },
        ] as const)
      : []),
    ...(prisma.authWithEmail
      ? ([
          {
            type: "otp",
            contact_channel: {
              type: "email",
              email: prisma.primaryEmail ?? "",
            },
          },
        ] as const)
      : []),
    ...prisma.projectUserOAuthAccounts.map(
      (a) =>
        ({
          type: "oauth",
          provider: {
            type: a.oauthProviderConfigId,
            provider_user_id: a.providerAccountId,
          },
        }) as const,
    ),
  ] as const;

  const connectedAccounts: UsersCrud["Admin"]["Read"]["connected_accounts"] = [
    ...prisma.projectUserOAuthAccounts.map(
      (a) =>
        ({
          type: "oauth",
          provider: {
            type: a.oauthProviderConfigId,
            provider_user_id: a.providerAccountId,
          },
        }) as const,
    ),
  ];

  return {
    id: prisma.projectUserId,
    display_name: prisma.displayName || null,
    primary_email: prisma.primaryEmail,
    primary_email_verified: prisma.primaryEmailVerified,
    profile_image_url: prisma.profileImageUrl,
    signed_up_at_millis: prisma.createdAt.getTime(),
    client_metadata: prisma.clientMetadata,
    client_read_only_metadata: prisma.clientReadOnlyMetadata,
    server_metadata: prisma.serverMetadata,
    has_password: !!prisma.passwordHash,
    auth_with_email: prisma.authWithEmail,
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
    last_active_at_millis: lastActiveAtMillis,
  };
};

export const getUserLastActiveAtMillis = async (userId: string, fallbackTo: number | Date): Promise<number> => {
  const event = await prismaClient.event.findFirst({
    where: {
      data: {
        path: ["$.userId"],
        equals: userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return event?.createdAt.getTime() ?? (typeof fallbackTo === "number" ? fallbackTo : fallbackTo.getTime());
};

// same as userIds.map(userId => getUserLastActiveAtMillis(userId, fallbackTo)), but uses a single query
export const getUsersLastActiveAtMillis = async (userIds: string[], fallbackTo: (number | Date)[]): Promise<number[]> => {
  if (userIds.length === 0) {
    // Prisma.join throws an error if the array is empty, so we need to handle that case
    return [];
  }

  const events = await prismaClient.$queryRaw<Array<{ userId: string; lastActiveAt: Date }>>`
    SELECT data->>'userId' as "userId", MAX("createdAt") as "lastActiveAt"
    FROM "Event"
    WHERE data->>'userId' = ANY(${Prisma.sql`ARRAY[${Prisma.join(userIds)}]`})
    GROUP BY data->>'userId'
  `;

  return userIds.map((userId, index) => {
    const event = events.find((e) => e.userId === userId);
    return event
      ? event.lastActiveAt.getTime()
      : typeof fallbackTo[index] === "number"
        ? (fallbackTo[index] as number)
        : (fallbackTo[index] as Date).getTime();
  });
};

export const usersCrudHandlers = createLazyProxy(() =>
  createCrudHandlers(usersCrud, {
    querySchema: yupObject({
      team_id: yupString()
        .uuid()
        .optional()
        .meta({ openapiField: { onlyShowInOperations: ["List"] } }),
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

      return userPrismaToCrud(db, await getUserLastActiveAtMillis(params.user_id, db.createdAt));
    },
    onList: async ({ auth, query }) => {
      const db = await prismaClient.projectUser.findMany({
        where: {
          projectId: auth.project.id,
          ...(query.team_id
            ? {
                teamMembers: {
                  some: {
                    teamId: query.team_id,
                  },
                },
              }
            : {}),
        },
        include: userFullInclude,
      });

      const lastActiveAtMillis = await getUsersLastActiveAtMillis(
        db.map((user) => user.projectUserId),
        db.map((user) => user.createdAt),
      );

      return {
        items: db.map((user, index) => userPrismaToCrud(user, lastActiveAtMillis[index])),
        is_paginated: false,
      };
    },
    onCreate: async ({ auth, data }) => {
      if (!data.primary_email && data.primary_email_auth_enabled) {
        throw new StatusError(400, "primary_email_auth_enabled cannot be true without primary_email");
      }
      if (!data.primary_email_auth_enabled && data.password) {
        throw new StatusError(400, "password cannot be set without primary_email_auth_enabled");
      }
      if (data.primary_email_auth_enabled) {
        // TODO: make this a transaction
        const users = await prismaClient.projectUser.findMany({
          where: {
            projectId: auth.project.id,
            primaryEmail: data.primary_email,
            authWithEmail: true,
          },
        });

        if (users.length > 0) {
          throw new KnownErrors.UserEmailAlreadyExists();
        }
      }

      const db = await prismaClient.projectUser.create({
        data: {
          projectId: auth.project.id,
          displayName: data.display_name === undefined ? undefined : data.display_name || null,
          clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
          clientReadOnlyMetadata: data.client_read_only_metadata === null ? Prisma.JsonNull : data.client_read_only_metadata,
          serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
          primaryEmail: data.primary_email,
          primaryEmailVerified: data.primary_email_verified ?? false,
          authWithEmail: data.primary_email_auth_enabled ?? false,
          passwordHash: data.password == null ? data.password : await hashPassword(data.password),
          profileImageUrl: data.profile_image_url,
          projectUserOAuthAccounts: data.oauth_providers
            ? {
                createMany: {
                  data: data.oauth_providers.map((provider) => ({
                    projectConfigId: auth.project.config.id,
                    oauthProviderConfigId: provider.id,
                    providerAccountId: provider.account_id,
                    email: provider.email,
                  })),
                },
              }
            : undefined,
          totpSecret: data.totp_secret_base64 == null ? data.totp_secret_base64 : Buffer.from(decodeBase64(data.totp_secret_base64)),
        },
        include: userFullInclude,
      });

      const result = userPrismaToCrud(db, await getUserLastActiveAtMillis(db.projectUserId, new Date()));

      if (auth.project.config.create_team_on_sign_up) {
        await teamsCrudHandlers.adminCreate({
          data: {
            display_name: data.display_name
              ? `${data.display_name}'s Team`
              : data.primary_email
                ? `${data.primary_email}'s Team`
                : "Personal Team",
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
            displayName: data.display_name === undefined ? undefined : data.display_name || null,
            clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
            clientReadOnlyMetadata: data.client_read_only_metadata === null ? Prisma.JsonNull : data.client_read_only_metadata,
            serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
            primaryEmail: data.primary_email,
            primaryEmailVerified: data.primary_email_verified ?? (data.primary_email !== undefined ? false : undefined),
            authWithEmail: data.primary_email_auth_enabled,
            passwordHash: data.password == null ? data.password : await hashPassword(data.password),
            profileImageUrl: data.profile_image_url,
            requiresTotpMfa: data.totp_secret_base64 === undefined ? undefined : data.totp_secret_base64 !== null,
            totpSecret: data.totp_secret_base64 == null ? data.totp_secret_base64 : Buffer.from(decodeBase64(data.totp_secret_base64)),
          },
          include: userFullInclude,
        });

        // if user password changed, reset all refresh tokens
        if (data.password !== undefined) {
          await prismaClient.projectUserRefreshToken.deleteMany({
            where: {
              projectId: auth.project.id,
              projectUserId: params.user_id,
            },
          });
        }

        return db;
      });

      const result = userPrismaToCrud(db, await getUserLastActiveAtMillis(params.user_id, new Date()));

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
    },
  }),
);

export const currentUserCrudHandlers = createLazyProxy(() =>
  createCrudHandlers(currentUserCrud, {
    paramsSchema: yupObject({} as const),
    async onRead({ auth }) {
      return await usersCrudHandlers.adminRead({
        project: auth.project,
        user_id: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
        allowedErrorTypes: [StatusError],
      });
    },
    async onUpdate({ auth, data }) {
      if (auth.type === "client" && data.profile_image_url && !validateBase64Image(data.profile_image_url)) {
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
      return await usersCrudHandlers.adminDelete({
        project: auth.project,
        user_id: auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser()),
        allowedErrorTypes: [StatusError],
      });
    },
  }),
);
