import { UserCustomizableJson, UserJson, ServerUserCustomizableJson, ServerUserJson } from "@stackframe/stack-shared";
import { ProjectUser } from "@prisma/client";
import { prismaClient } from "@/prisma-client";
import { ProjectDB, fullProjectInclude, projectJsonFromDbType } from "@/lib/projects";

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
      }
    },
  });

  return users.map((u) => getServerUserFromDbType(u, u.project));
}

export async function updateClientUser(
  projectId: string,
  userId: string,
  update: Partial<UserCustomizableJson>,
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
  update: Partial<ServerUserCustomizableJson>,
): Promise<ServerUserJson | null> {
  const user = await prismaClient.projectUser.update({
    where: {
      projectId_projectUserId: {
        projectId,
        projectUserId: userId,
      },
    },
    include: {
      project: {
        include: fullProjectInclude,
      }
    },
    data: Object.fromEntries(Object.entries({
      displayName: update.displayName,
      primaryEmail: update.primaryEmail,
      primaryEmailVerified: update.primaryEmailVerified,
      clientMetadata: update.clientMetadata as any,
      serverMetadata: update.serverMetadata as any,
    }).filter(([_, v]) => v !== undefined)),
  });

  return getServerUserFromDbType(user, user.project);
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
  };
}

function getServerUserFromDbType(
  projectUser: ProjectUser, 
  projectDB: ProjectDB,
): ServerUserJson {
  const projectJson = projectJsonFromDbType(projectDB);

  return {
    projectId: projectUser.projectId,
    id: projectUser.projectUserId,
    displayName: projectUser.displayName,
    primaryEmail: projectUser.primaryEmail,
    primaryEmailVerified: projectUser.primaryEmailVerified,
    profileImageUrl: projectUser.profileImageUrl,
    signedUpAtMillis: projectUser.createdAt.getTime(),
    clientMetadata: projectUser.clientMetadata as any,
    serverMetadata: projectUser.serverMetadata as any,
    authMethod: projectUser.passwordHash ? 'credential' : 'oauth', // not used anymore, for backwards compatibility
    hasPassword: !!projectUser.passwordHash,
    authWithEmail: projectUser.authWithEmail,
    oauthProviders: projectJson.evaluatedConfig.oauthProviders.map((provider) => provider.id),
  };
}
