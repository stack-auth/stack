import { prismaClient } from "@/prisma-client";
import { TeamJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerTeamCustomizableJson, ServerTeamJson, ServerTeamMemberJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { Prisma } from "@prisma/client";

export const fullTeamMemberInclude = {
  team: true,
} as const satisfies Prisma.TeamMemberInclude;

export type ServerTeamMemberDB = Prisma.TeamMemberGetPayload<{ include: {
  projectUser: true,
}, }>;

export async function listUserTeams(projectId: string, userId: string): Promise<TeamJson[]> {
  const members = await prismaClient.teamMember.findMany({
    where: {
      projectId,
      projectUserId: userId,
    },
    include: fullTeamMemberInclude,
  });

  return members.map((member) => ({
    id: member.teamId,
    displayName: member.team.displayName,
    createdAtMillis: member.team.createdAt.getTime(),
  }));
}

export async function listUserServerTeams(projectId: string, userId: string): Promise<ServerTeamJson[]> {
  return await listUserTeams(projectId, userId); // currently ServerTeam and ClientTeam are the same
}

export async function listTeams(projectId: string): Promise<TeamJson[]> {
  const result = await prismaClient.team.findMany({
    where: {
      projectId,
    },
  });

  return result.map(team => ({
    id: team.teamId,
    displayName: team.displayName,
    createdAtMillis: team.createdAt.getTime(),
  }));
}

export async function listServerTeams(projectId: string): Promise<ServerTeamJson[]> {
  return await listTeams(projectId);  // currently ServerTeam and ClientTeam are the same
}

export async function listServerTeamMembers(projectId: string, teamId: string): Promise<ServerTeamMemberJson[]> {
  const members = await prismaClient.teamMember.findMany({
    where: {
      projectId,
      teamId,
    },
    include: {
      projectUser: true
    },
  });

  return members.map((member) => getServerTeamMemberFromDbType(member));
}

export async function getTeam(projectId: string, teamId: string): Promise<TeamJson | null> {
  // TODO more efficient filtering
  const teams = await listTeams(projectId);
  return teams.find(team => team.id === teamId) || null;
}

export async function getServerTeam(projectId: string, teamId: string): Promise<ServerTeamJson | null> {
  // TODO more efficient filtering
  const teams = await listServerTeams(projectId);
  return teams.find(team => team.id === teamId) || null;
}

export async function updateServerTeam(projectId: string, teamId: string, update: Partial<ServerTeamCustomizableJson>): Promise<void> {
  await prismaClient.team.update({
    where: {
      projectId_teamId: {
        projectId,
        teamId,
      },
    },
    data: filterUndefined(update),
  });
}

export async function createServerTeam(projectId: string, team: ServerTeamCustomizableJson): Promise<ServerTeamJson> {
  const result = await prismaClient.team.create({
    data: {
      projectId,
      displayName: team.displayName,
    },
  });
  return {
    id: result.teamId,
    displayName: result.displayName,
    createdAtMillis: result.createdAt.getTime(),
  };
}

export async function deleteServerTeam(projectId: string, teamId: string): Promise<void> {
  const deleted = await prismaClient.team.delete({
    where: {
      projectId_teamId: {
        projectId,
        teamId,
      },
    },
  });
  if (!deleted) {
    throw new Error("Team not found");
  }
}

export async function addUserToTeam(projectId: string, teamId: string, userId: string): Promise<void> {
  await prismaClient.teamMember.create({
    data: {
      projectId,
      teamId,
      projectUserId: userId,
    },
  });
}

export async function removeUserFromTeam(projectId: string, teamId: string, userId: string): Promise<void> {
  await prismaClient.teamMember.deleteMany({
    where: {
      projectId,
      teamId,
      projectUserId: userId,
    },
  });
}

export function getServerTeamMemberFromDbType(member: ServerTeamMemberDB): ServerTeamMemberJson {
  return {
    userId: member.projectUserId,
    teamId: member.teamId,
    displayName: member.projectUser.displayName,
  };
}
