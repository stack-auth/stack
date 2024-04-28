import { UserJson, ServerUserJson } from "@stackframe/stack-shared";
import { Organization, ProjectUser } from "@prisma/client";
import { prismaClient } from "@/prisma-client";
import { ProjectDB, fullProjectInclude, projectJsonFromDbType } from "@/lib/projects";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { fullOrganizationInclude } from "./organizations";
import { UserUpdateJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerUserUpdateJson } from "@stackframe/stack-shared/dist/interface/serverInterface";

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
      organization: {
        include: fullOrganizationInclude,
      },
    },
  });

  return users.map((u) => getServerUserFromDbType(u, u.project, u.organization));
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
        organization: {
          include: fullOrganizationInclude,
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

  return getServerUserFromDbType(user, user.project, user.organization);
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
    organization: serverUser.organization ? {
      id: serverUser.organization.id,
      displayName: serverUser.organization.displayName,
      createdAtMillis: serverUser.organization.createdAtMillis,
    } : null,
  };
}

function getServerUserFromDbType(
  projectUser: ProjectUser, 
  projectDB: ProjectDB,
  organization: Organization | null,
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
    organization: organization ? {
      id: organization.organizationId,
      displayName: organization.displayName,
      createdAtMillis: organization.createdAt.getTime(),
    } : null,
  };
}
