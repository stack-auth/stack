import { prismaClient } from "@/prisma-client";
import { TeamCustomizableJson, TeamJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerTeamCustomizableJson, ServerTeamJson, ServerTeamMemberJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { Prisma } from "@prisma/client";
import { getServerUserFromDbType } from "./users";
import { serverUserInclude } from "./users";
import { getProject } from "./projects";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { grantTeamUserPermission } from "./permissions";

// TODO technically we can split this; listUserTeams only needs `team`, and listServerTeams only needs `projectUser`; listTeams needs neither
// note: this is a function to prevent circular dependencies between the teams and users file
export const createFullTeamMemberInclude = () => ({
  team: true,
  projectUser: {
    include: serverUserInclude,
  },
} as const satisfies Prisma.TeamMemberInclude);

export type ServerTeamMemberDB = Prisma.TeamMemberGetPayload<{ include: ReturnType<typeof createFullTeamMemberInclude> }>;

export async function listUserTeams(projectId: string, userId: string): Promise<TeamJson[]> {
  const members = await prismaClient.teamMember.findMany({
    where: {
      projectId,
      projectUserId: userId,
    },
    include: createFullTeamMemberInclude(),
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
    include: createFullTeamMemberInclude(),
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

export async function createTeam(projectId: string, team: TeamCustomizableJson): Promise<TeamJson> {
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

export async function createServerTeam(projectId: string, team: ServerTeamCustomizableJson): Promise<ServerTeamJson> {
  return await createTeam(projectId, team); // currently ServerTeam and ClientTeam are the same
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

export async function addUserToTeam(options: { projectId: string, teamId: string, userId: string }): Promise<void> {
  await prismaClient.teamMember.create({
    data: {
      projectId: options.projectId,
      teamId: options.teamId,
      projectUserId: options.userId,
    },
  });
}

export async function removeUserFromTeam(options: { projectId: string, teamId: string, userId: string }): Promise<void> {
  await prismaClient.teamMember.deleteMany({
    where: {
      projectId: options.projectId,
      teamId: options.teamId,
      projectUserId: options.userId,
    },
  });
}

export function getClientTeamFromServerTeam(team: ServerTeamJson): TeamJson {
  return {
    id: team.id,
    displayName: team.displayName,
    createdAtMillis: team.createdAtMillis,
  };
}

export function getServerTeamFromDbType(team: Prisma.TeamGetPayload<{}>): ServerTeamJson {
  return {
    id: team.teamId,
    displayName: team.displayName,
    createdAtMillis: team.createdAt.getTime(),
  };
}

export function getServerTeamMemberFromDbType(member: ServerTeamMemberDB): ServerTeamMemberJson {
  return {
    userId: member.projectUserId,
    user: getServerUserFromDbType(member.projectUser),
    teamId: member.teamId,
    displayName: member.projectUser.displayName,
  };
}

async function grantDefaultTeamPermissions(options: { projectId: string, teamId: string, userId: string, type: 'creator' | 'member' }): Promise<void> {
  const project = await getProject(options.projectId);
  if (!project) {
    throw new StackAssertionError("Project not found");
  }

  const permissionIds = options.type === 'creator' ? 
    project.evaluatedConfig.teamCreatorDefaultPermissions.map(x => x.id) :
    project.evaluatedConfig.teamMemberDefaultPermissions.map(x => x.id);

  // TODO: improve performance by batching
  for (const permissionId of permissionIds) {
    await grantTeamUserPermission({
      projectId: options.projectId,
      teamId: options.teamId,
      projectUserId: options.userId,
      permissionId,
      type: 'team',
    });
  }
}

export async function grantDefaultTeamCreatorPermissions(options: { projectId: string, teamId: string, userId: string }): Promise<void> {
  await grantDefaultTeamPermissions({ ...options, type: 'creator' });
}

export async function grantDefaultTeamMemberPermissions(options: { projectId: string, teamId: string, userId: string }): Promise<void> {
  await grantDefaultTeamPermissions({ ...options, type: 'member' });
}

export async function createTeamForUser(options: { projectId: string, userId: string, data: ServerTeamCustomizableJson }): Promise<TeamJson> {
  const team = await createTeam(options.projectId, options.data);
  await addUserToTeam({ projectId: options.projectId, teamId: team.id, userId: options.userId });
  await grantDefaultTeamCreatorPermissions({ projectId: options.projectId, teamId: team.id, userId: options.userId });
  return team;
}

export async function createServerTeamForUser(options: { projectId: string, userId: string, data: ServerTeamCustomizableJson }): Promise<ServerTeamJson> {
  return await createTeamForUser(options); // currently ServerTeam and ClientTeam are the same
}