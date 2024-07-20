// TODO remove and replace with CRUD handler

import { prismaClient } from "@/prisma-client";
import { Prisma } from "@prisma/client";
import { TeamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";

// TODO technically we can split this; listUserTeams only needs `team`, and listServerTeams only needs `projectUser`; listTeams needs neither
// note: this is a function to prevent circular dependencies between the teams and users file
export const createFullTeamMemberInclude = () => ({
  team: true,
} as const satisfies Prisma.TeamMemberInclude);

export type ServerTeamMemberDB = Prisma.TeamMemberGetPayload<{ include: ReturnType<typeof createFullTeamMemberInclude> }>;

export async function listUserTeams(projectId: string, userId: string): Promise<TeamsCrud["Client"]["Read"][]> {
  const members = await prismaClient.teamMember.findMany({
    where: {
      projectId,
      projectUserId: userId,
    },
    include: createFullTeamMemberInclude(),
  });

  return members.map((member) => ({
    id: member.teamId,
    display_name: member.team.displayName,
    profile_image_url: member.team.profileImageUrl,
  }));
}

export async function listUserServerTeams(projectId: string, userId: string): Promise<TeamsCrud["Server"]["Read"][]> {
  const members = await prismaClient.teamMember.findMany({
    where: {
      projectId,
      projectUserId: userId,
    },
    include: createFullTeamMemberInclude(),
  });

  return members.map((member) => ({
    id: member.teamId,
    display_name: member.team.displayName,
    profile_image_url: member.team.profileImageUrl,
    created_at_millis: member.team.createdAt.getTime(),
  }));
}

export async function listTeams(projectId: string): Promise<TeamsCrud["Client"]["Read"][]> {
  const result = await prismaClient.team.findMany({
    where: {
      projectId,
    },
  });

  return result.map(team => ({
    id: team.teamId,
    display_name: team.displayName,
    profile_image_url: team.profileImageUrl,
  }));
}

export async function listServerTeams(projectId: string): Promise<TeamsCrud["Server"]["Read"][]> {
  const result = await prismaClient.team.findMany({
    where: {
      projectId,
    },
  });

  return result.map(team => ({
    id: team.teamId,
    display_name: team.displayName,
    profile_image_url: team.profileImageUrl,
    created_at_millis: team.createdAt.getTime(),
  }));

}

export async function getTeam(projectId: string, teamId: string): Promise<TeamsCrud["Client"]["Read"] | null> {
  // TODO more efficient filtering
  const teams = await listTeams(projectId);
  return teams.find(team => team.id === teamId) || null;
}

export async function getServerTeam(projectId: string, teamId: string): Promise<TeamsCrud["Server"]["Read"] | null> {
  // TODO more efficient filtering
  const teams = await listServerTeams(projectId);
  return teams.find(team => team.id === teamId) || null;
}

export async function updateServerTeam(projectId: string, teamId: string, update: TeamsCrud["Server"]["Update"]): Promise<void> {
  await prismaClient.team.update({
    where: {
      projectId_teamId: {
        projectId,
        teamId,
      },
    },
    data: {
      displayName: update.display_name,
      profileImageUrl: update.profile_image_url,
    },
  });
}

export async function createServerTeam(projectId: string, team: TeamsCrud["Client"]["Create"]): Promise<TeamsCrud["Server"]["Read"]> {
  const result = await prismaClient.team.create({
    data: {
      projectId,
      displayName: team.display_name,
    },
  });
  return {
    id: result.teamId,
    display_name: result.displayName,
    created_at_millis: result.createdAt.getTime(),
    profile_image_url: result.profileImageUrl,
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

export function getClientTeamFromServerTeam(team: TeamsCrud["Server"]["Read"]): TeamsCrud["Client"]["Read"] {
  return {
    id: team.id,
    display_name: team.display_name,
    profile_image_url: team.profile_image_url,
  };
}

export function getServerTeamFromDbType(team: Prisma.TeamGetPayload<{}>): TeamsCrud["Server"]["Read"] {
  return {
    id: team.teamId,
    display_name: team.displayName,
    created_at_millis: team.createdAt.getTime(),
    profile_image_url: team.profileImageUrl,
  };
}
