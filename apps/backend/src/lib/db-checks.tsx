import { KnownErrors } from "@stackframe/stack-shared";
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