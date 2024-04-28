import { ServerUser } from "@stackframe/stack";
import { useAdminApp } from "../use-admin-app";

export type Organization = {
  id: string,
  displayName: string,
  memberCount: number,
  createdAt: Date,
}

export type ServerOrganizaiton = Organization & {
  addUser: (userId: string) => Promise<void>,
  listUsers: () => Promise<ServerUser[]>,
  getUser(userId: string): Promise<ServerUser | null>,
  listPermissions: () => Promise<string[]>,
  removeUser: (userId: string) => Promise<void>,
  update: (organization: Partial<Pick<Organization, "displayName">>) => Promise<void>,
  delete: () => Promise<void>,
}

export const useMockOrgs = () => {
  const app =  useAdminApp();
  const MockOrg: ServerOrganizaiton = {
    id: "mock-org",
    displayName: "Mock Organization",
    memberCount: 2,
    createdAt: new Date(),
    addUser: async (userId: string) => {
      console.log(`Adding user ${userId} to organization`);
    },
    listUsers: async () => {
      const user = await app.getServerUser();
      if (!user) {
        return [];
      }
      return [user];
    },
    getUser: async (userId: string) => {
      return await app.getServerUser();
    },
    listPermissions: async () => {
      return ["admin"];
    },
    removeUser: async (userId: string) => {
      console.log(`Removing user ${userId} from organization`);
    },
    update: async (organization: Partial<Pick<Organization, "displayName">>) => {
      console.log(`Updating organization to ${organization.displayName}`);
    },
    delete: async () => {
      console.log("Deleting organization");
    },
  };

  return [
    MockOrg,
    {
      ...MockOrg,
      id: "mock-org-2",
      displayName: "Mock Organization 2",
      memberCount: 5,
    }
  ];
};