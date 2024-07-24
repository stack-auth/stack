import { KnownErrors } from "@stackframe/stack-shared";
import { PrismaTransaction } from "./types";
import { TeamSystemPermission, listUserTeamPermissions } from "./permissions";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";


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

export async function ensureTeamMembershipExist(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    teamId: string,
    userId: string,
  }
) {
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

export async function ensureTeamExist(
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

export async function ensureUserHasTeamPermission(
  tx: PrismaTransaction,
  options: {
    project: ProjectsCrud["Admin"]["Read"],
    teamId: string,
    userId: string,
    permissionId: TeamSystemPermission,
  }
) {
  const result = await listUserTeamPermissions(tx, {
    project: options.project,
    teamId: options.teamId,
    userId: options.userId,
    permissionId: options.permissionId,
    recursive: true,
  });

  if (result.length === 0) {
    throw new KnownErrors.TeamPermissionRequired(options.teamId, options.userId, options.permissionId);
  }
}