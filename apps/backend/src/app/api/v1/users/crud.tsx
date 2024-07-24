import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { BooleanTrue, Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { teamPrismaToCrud } from "../teams/crud";

const fullInclude = {
  projectUserOAuthAccounts: true,
  teamMembers: {
    include: {
      team: true,
    },
    where: {
      isSelected: BooleanTrue.TRUE,
    },
  },
};

const prismaToCrud = (prisma: Prisma.ProjectUserGetPayload<{ include: typeof fullInclude}>) => {
  const selectedTeamMembers = prisma.teamMembers;
  if (selectedTeamMembers.length > 1) {
    throw new StackAssertionError("User cannot have more than one selected team; this should never happen");
  }
  return {
    id: prisma.projectUserId,
    display_name: prisma.displayName || null,
    primary_email: prisma.primaryEmail,
    primary_email_verified: prisma.primaryEmailVerified,
    profile_image_url: prisma.profileImageUrl,
    signed_up_at_millis: prisma.createdAt.getTime(),
    client_metadata: prisma.clientMetadata,
    server_metadata: prisma.serverMetadata,
    auth_method: prisma.passwordHash ? 'credential' as const : 'oauth' as const, // not used anymore, for backwards compatibility
    has_password: !!prisma.passwordHash,
    auth_with_email: prisma.authWithEmail,
    oauth_providers: prisma.projectUserOAuthAccounts.map((a) => ({
      id: a.oauthProviderConfigId,
      account_id: a.providerAccountId,
      email: a.email,
    })),
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
      include: fullInclude,
    });

    if (!db) {
      throw new KnownErrors.UserNotFound();
    }

    return prismaToCrud(db);
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
      include: fullInclude,
    });

    return {
      items: db.map(prismaToCrud),
      is_paginated: false,
    };
  },
  onCreate: async ({ auth, data }) => {
    const db = await prismaClient.projectUser.create({
      data: {
        projectId: auth.project.id,
        displayName: data.display_name === undefined ? undefined : (data.display_name || null),
        clientMetadata: data.client_metadata === null ? Prisma.JsonNull : data.client_metadata,
        serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
        primaryEmail: data.primary_email,
        primaryEmailVerified: data.primary_email_verified ?? false,
        authWithEmail: data.primary_email_auth_enabled ?? false,
        passwordHash: data.password == null ? data.password : await hashPassword(data.password),
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
      },
      include: fullInclude,
    });

    return prismaToCrud(db);
  },
  onUpdate: async ({ auth, data, params }) => {
    const db = await prismaClient.$transaction(async (tx) => {
      if (data.selected_team_id !== undefined) {
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
          serverMetadata: data.server_metadata === null ? Prisma.JsonNull : data.server_metadata,
          primaryEmail: data.primary_email,
          primaryEmailVerified: data.primary_email_verified ?? (data.primary_email !== undefined ? false : undefined),
          authWithEmail: data.primary_email_auth_enabled,
          passwordHash: data.password == null ? data.password : await hashPassword(data.password),
          profileImageUrl: data.profile_image_url,
        },
        include: fullInclude,
      });

      return db;
    });

    return prismaToCrud(db);
  },
  onDelete: async ({ auth, params }) => {
    await prismaClient.projectUser.delete({
      where: {
        projectId_projectUserId: {
          projectId: auth.project.id,
          projectUserId: params.user_id,
        },
      },
      include: fullInclude,
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
