import { UserJson, ServerUserJson } from "@stackframe/stack-shared";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/prisma-client";
import { fullProjectInclude, projectJsonFromDbType } from "@/lib/projects";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { fullmemberInclude as fullTeamMemberInclude } from "./teams";
import { UserUpdateJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerUserUpdateJson } from "@stackframe/stack-shared/dist/interface/serverInterface";

export type ServerUserDB = Prisma.ProjectUserGetPayload<{ include: {
  project: { include: typeof fullProjectInclude },
  teamMembers: { include: typeof fullTeamMemberInclude },
}, }>;

export async function getClientUser(projectId: string, userId: string): Promise<UserJson | null> {
  return await updateClientUser(projectId, userId, {});
}

export async function getServerUser(projectId: string, userId: string): Promise<ServerUserJson | null> {
  return await updateServerUser(projectId, userId, {});
}

export async function listServerUsers(projectId: string): Promise<ServerUserJson[]> {
  const users = await prismaClient.projectUser.findMany({
    where: {
      projectId,
    },
    include: {
      project: {
        include: fullProjectInclude,
      },
      teamMembers: {
        include: fullTeamMemberInclude,
      },
    },
  });

  return users.map((u) => getServerUserFromDbType(u));
}

export async function updateClientUser(
  projectId: string,
  userId: string,
  update: UserUpdateJson,
): Promise<UserJson | null> {
  const user = await updateServerUser(
    projectId,
    userId,
    {
      displayName: update.displayName,
      clientMetadata: update.clientMetadata,
    },
  );
  if (!user) {
    return null;
  }

  return getClientUserFromServerUser(user);
}

export async function updateServerUser(
  projectId: string,
  userId: string,
  update: ServerUserUpdateJson,
): Promise<ServerUserJson | null> {
  let user;
  try {
    user = await prismaClient.projectUser.update({
      where: {
        projectId_projectUserId: {
          projectId,
          projectUserId: userId,
        },
      },
      include: {
        project: {
          include: fullProjectInclude,
        },
        teamMembers: {
          include: fullTeamMemberInclude,
        },
      },
      data: filterUndefined({
        displayName: update.displayName,
        primaryEmail: update.primaryEmail,
        primaryEmailVerified: update.primaryEmailVerified,
        clientMetadata: update.clientMetadata as any,
        serverMetadata: update.serverMetadata as any,
      }),
    });
  } catch (e) {
    // TODO this is kinda hacky, instead we should have the entire method throw an error instead of returning null and have a separate getServerUser function that may return null
    if ((e as any)?.code === 'P2025') {
      return null;
    }
    throw e;
  }

  return getServerUserFromDbType(user);
}

export async function deleteServerUser(projectId: string, userId: string): Promise<void> {
  await prismaClient.projectUser.delete({
    where: {
      projectId_projectUserId: {
        projectId,
        projectUserId: userId,
      },
    },
  });
}

function getClientUserFromServerUser(serverUser: ServerUserJson): UserJson {
  return {
    projectId: serverUser.projectId,
    id: serverUser.id,
    displayName: serverUser.displayName,
    primaryEmail: serverUser.primaryEmail,
    primaryEmailVerified: serverUser.primaryEmailVerified,
    profileImageUrl: serverUser.profileImageUrl,
    signedUpAtMillis: serverUser.signedUpAtMillis,
    clientMetadata: serverUser.clientMetadata,
    authMethod: serverUser.authMethod, // not used anymore, for backwards compatibility
    authWithEmail: serverUser.authWithEmail,
    hasPassword: serverUser.hasPassword,
    oauthProviders: serverUser.oauthProviders,
    teams: serverUser.teams,
  };
}

function getServerUserFromDbType(
  user: ServerUserDB,
): ServerUserJson {
  const projectJson = projectJsonFromDbType(user.project);

  return {
    projectId: user.projectId,
    id: user.projectUserId,
    displayName: user.displayName,
    primaryEmail: user.primaryEmail,
    primaryEmailVerified: user.primaryEmailVerified,
    profileImageUrl: user.profileImageUrl,
    signedUpAtMillis: user.createdAt.getTime(),
    clientMetadata: user.clientMetadata as any,
    serverMetadata: user.serverMetadata as any,
    authMethod: user.passwordHash ? 'credential' : 'oauth', // not used anymore, for backwards compatibility
    hasPassword: !!user.passwordHash,
    authWithEmail: user.authWithEmail,
    oauthProviders: projectJson.evaluatedConfig.oauthProviders.map((provider) => provider.id),
    teams: user.teamMembers.map((member) => ({
      id: member.teamId,
      displayName: member.team.displayName,
      createdAtMillis: member.team.createdAt.getTime(),
    })),
  };
}
