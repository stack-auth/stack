import { ServerUser, useUser } from "@stackframe/stack";
import { useAdminApp } from "../use-admin-app";

export type Team = {
  id: string,
  displayName: string,
  memberCount: number,
  createdAt: Date,
}

export type ServerTeam = Team & {
  addUser: (userId: string) => Promise<void>,
  listUsers: () => Promise<ServerUser[]>,
  getUser(userId: string): Promise<ServerUser | null>,
  listPermissions: () => Promise<string[]>,
  removeUser: (userId: string) => Promise<void>,
  update: (team: Partial<Pick<Team, "displayName">>) => Promise<void>,
  delete: () => Promise<void>,
}

export const useMockTeams = () => {
  const user = useUser({ or: 'throw' }) as unknown as ServerUser;
  const mockTeam: ServerTeam = {
    id: "mock-team",
    displayName: "Mock Team",
    memberCount: 2,
    createdAt: new Date(),
    addUser: async (userId: string) => {
      console.log(`Adding user ${userId} to team`);
    },
    listUsers: async () => {
      if (!user) {
        return [];
      }
      return [user];
    },
    getUser: async (userId: string) => {
      return user;
    },
    listPermissions: async () => {
      return ["admin"];
    },
    removeUser: async (userId: string) => {
      console.log(`Removing user ${userId} from team`);
    },
    update: async (team: Partial<Pick<Team, "displayName">>) => {
      console.log(`Updating team to ${team.displayName}`);
    },
    delete: async () => {
      console.log("Deleting team");
    },
  };

  return [
    mockTeam,
    {
      ...mockTeam,
      id: "mock-team-2",
      displayName: "Mock Team 2",
      memberCount: 5,
    }
  ];
};