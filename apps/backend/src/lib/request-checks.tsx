import { ProxiedOAuthProviderType, StandardOAuthProviderType } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { ProviderType, sharedProviders, standardProviders } from "@stackframe/stack-shared/dist/utils/oauth";
import { typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";
import { listUserTeamPermissions } from "./permissions";
import { PrismaTransaction } from "./types";


async function _getTeamMembership(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    teamId: string, userId: string,
  }
) {
  return await tx.teamMember.findUnique({
    where: {
      projectId_projectUserId_teamId: {
        projectId: options.projectId,
        projectUserId: options.userId,
        teamId: options.teamId,
      },
    },
  });
}

export async function ensureTeamMembershipExists(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    teamId: string,
    userId: string,
  }
) {
  await ensureUserExists(tx, { projectId: options.projectId, userId: options.userId });

  const member = await _getTeamMembership(tx, options);

  if (!member) {
    throw new KnownErrors.TeamMembershipNotFound(options.teamId, options.userId);
  }
}

export async function ensureTeamMembershipDoesNotExist(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    teamId: string,
    userId: string,
  }
) {
  const member = await _getTeamMembership(tx, options);

  if (member) {
    throw new KnownErrors.TeamMembershipAlreadyExists();
  }
}

export async function ensureTeamExists(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    teamId: string,
  }
) {
  const team = await tx.team.findUnique({
    where: {
      projectId_teamId: {
        projectId: options.projectId,
        teamId: options.teamId,
      },
    },
  });

  if (!team) {
    throw new KnownErrors.TeamNotFound(options.teamId);
  }
}

export async function ensureUserTeamPermissionExists(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"],
    teamId: string,
    userId: string,
    permissionId: string,
    errorType: 'required' | 'not-exist',
    recursive: boolean,
  }
) {
  await ensureTeamMembershipExists(tx, {
    projectId: options.project.id,
    teamId: options.teamId,
    userId: options.userId,
  });

  const result = await listUserTeamPermissions(tx, {
    project: options.project,
    teamId: options.teamId,
    userId: options.userId,
    permissionId: options.permissionId,
    recursive: options.recursive,
  });

  if (result.length === 0) {
    if (options.errorType === 'not-exist') {
      throw new KnownErrors.TeamPermissionNotFound(options.teamId, options.userId, options.permissionId);
    } else {
      throw new KnownErrors.TeamPermissionRequired(options.teamId, options.userId, options.permissionId);
    }
  }
}

export async function ensureUserExists(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    userId: string,
  }
) {
  const user = await tx.projectUser.findUnique({
    where: {
      projectId_projectUserId: {
        projectId: options.projectId,
        projectUserId: options.userId,
      },
    },
  });

  if (!user) {
    throw new KnownErrors.UserNotFound();
  }
}

export function ensureSharedProvider(
  providerId: ProviderType
): Lowercase<ProxiedOAuthProviderType> {
  if (!sharedProviders.includes(providerId as any)) {
    throw new KnownErrors.InvalidSharedOAuthProviderId(providerId);
  }
  return providerId as any;
}

export function ensureStandardProvider(
  providerId: ProviderType
): Lowercase<StandardOAuthProviderType> {
  if (!standardProviders.includes(providerId as any)) {
    throw new KnownErrors.InvalidStandardOAuthProviderId(providerId);
  }
  return providerId as any;
}

export async function ensureContactChannelDoesNotExists(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    userId: string,
    type: 'email',
    value: string,
  }
) {
  const contactChannel = await tx.contactChannel.findUnique({
    where: {
      projectId_projectUserId_type_value: {
        projectId: options.projectId,
        projectUserId: options.userId,
        type: typedToUppercase(options.type),
        value: options.value,
      },
    },
  });

  if (contactChannel) {
    throw new StatusError(StatusError.BadRequest, 'Contact channel already exists');
  }
}

export async function ensureContactChannelExists(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    userId: string,
    contactChannelId: string,
  }
) {
  const contactChannel = await tx.contactChannel.findUnique({
    where: {
      projectId_projectUserId_id: {
        projectId: options.projectId,
        projectUserId: options.userId,
        id: options.contactChannelId,
      },
    },
  });

  if (!contactChannel) {
    throw new StatusError(StatusError.BadRequest, 'Contact channel not found');
  }

  return contactChannel;
}
