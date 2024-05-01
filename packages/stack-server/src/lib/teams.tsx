import { prismaClient } from "@/prisma-client";
import { listServerUsers } from "./users";
import { TeamJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerTeamCustomizableJson, ServerTeamJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { Prisma } from "@prisma/client";

export const fullTeamInclude = {} as const satisfies Prisma.TeamInclude;


export async function getTeams(projectId: string): Promise<TeamJson[]> {
  return await getServerTeams(projectId);
}

export async function getServerTeams(projectId: string): Promise<ServerTeamJson[]> {
  const result = await prismaClient.team.findMany({
    where: {
      projectId,
    },
    include: fullTeamInclude,
  });
  return result.map(team => ({
    id: team.teamId,
    displayName: team.displayName,
    createdAtMillis: team.createdAt.getTime(),
  }));
}

export async function listServerMembers(projectId: string, teamId: string): Promise<string[]> {
  // TODO more efficient filtering
  const users = await listServerUsers(projectId);
  return users.filter(user => user.team?.id === teamId).map(user => user.id);
}

export async function getTeam(projectId: string, teamId: string): Promise<TeamJson | null> {
  // TODO more efficient filtering
  const teams = await getTeams(projectId);
  return teams.find(team => team.id === teamId) || null;
}

export async function getServerTeam(projectId: string, teamId: string): Promise<ServerTeamJson | null> {
  // TODO more efficient filtering
  const teams = await getServerTeams(projectId);
  return teams.find(team => team.id === teamId) || null;
}

export async function updateServerTeam(projectId: string, teamId: string, update: ServerTeamCustomizableJson): Promise<void> {
  await prismaClient.team.update({
    where: {
      projectId_teamId: {
        projectId,
        teamId,
      },
    },
    data: filterUndefined({
      displayName: update.displayName,
    }),
  });
}

export async function createServerTeam(projectId: string, team: ServerTeamCustomizableJson): Promise<ServerTeamJson> {
  const result = await prismaClient.team.create({
    data: {
      projectId,
      displayName: team.displayName,
    },
    include: fullTeamInclude,
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
