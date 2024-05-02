import { 
  ClientInterfaceOptions, 
  UserJson, 
  TokenStore, 
  StackClientInterface,
  ReadonlyTokenStore,
  OrglikeJson,
  UserUpdateJson,
  PermissionJson,
  PermissionScopeJson,
} from "./clientInterface";
import { Result } from "../utils/results";
import { ReadonlyJson } from "../utils/json";

export type ServerUserJson = UserJson & {
  readonly serverMetadata: ReadonlyJson,
};

export type ServerUserUpdateJson = UserUpdateJson & {
  readonly serverMetadata?: ReadonlyJson,
  readonly primaryEmail?: string | null,
  readonly primaryEmailVerified?: boolean,
}

export type ServerOrglikeCustomizableJson = Pick<ServerOrglikeJson, "displayName">;
export type ServerOrglikeJson = OrglikeJson & {};

export type ServerTeamCustomizableJson = ServerOrglikeCustomizableJson;
export type ServerTeamJson = ServerOrglikeJson;

export type ServerPermissionCreateJson = {
  readonly id: string,
  readonly description?: string,
  readonly inheritFromPermissionIds: string[],
};

export type ServerPermissionJson = PermissionJson & ServerPermissionCreateJson & {
  readonly __databaseUniqueId: string,
  readonly scope: PermissionScopeJson,
};


export type ServerAuthApplicationOptions = (
  & ClientInterfaceOptions
  & (
    | {
      readonly secretServerKey: string,
    }
    | {
      readonly projectOwnerTokens: ReadonlyTokenStore,
    }
  )
);


export class StackServerInterface extends StackClientInterface {
  constructor(public override options: ServerAuthApplicationOptions) {
    super(options);
  }

  protected async sendServerRequest(path: string, options: RequestInit, tokenStore: TokenStore | null) {
    return await this.sendClientRequest(
      path,
      {
        ...options,
        headers: {
          "x-stack-secret-server-key": "secretServerKey" in this.options ? this.options.secretServerKey : "",
          ...options.headers,
        },
      },
      tokenStore,
    );
  }

  async getServerUserByToken(tokenStore: TokenStore): Promise<Result<ServerUserJson>> {
    const response = await this.sendServerRequest(
      "/current-user?server=true",
      {},
      tokenStore,
    );
    const user: ServerUserJson | null = await response.json();
    if (!user) return Result.error(new Error("Failed to get user"));
    return Result.ok(user);
  }

  async createPermission(data: ServerPermissionCreateJson): Promise<ServerPermissionJson> {
    const response = await this.sendServerRequest(
      "/teams/permissions?server=true",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          scope: {
            type: "any-team",
          }
        }),
      },
      null,
    );
    return await response.json();
  }

  async listUsers(): Promise<ServerUserJson[]> {
    const response = await this.sendServerRequest("/users?server=true", {}, null);
    return await response.json();
  }

  async listTeams(): Promise<ServerTeamJson[]> {
    const response = await this.sendServerRequest("/teams?server=true", {}, null);
    return await response.json();
  }

  async listTeamUsers(teamId: string): Promise<ServerUserJson[]> {
    const response = await this.sendServerRequest(`/teams/${teamId}/users?server=true`, {}, null);
    return await response.json();
  }

  async createTeam(data: ServerTeamCustomizableJson): Promise<ServerTeamJson> {
    const response = await this.sendServerRequest(
      "/teams?server=true",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await response.json();
  }
  
  async updateTeam(teamId: string, data: Partial<ServerTeamCustomizableJson>): Promise<void> {
    await this.sendServerRequest(
      `/teams/${teamId}?server=true`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
  }

  async addUserToTeam(options: {
    userId: string, 
    teamId: string,
  }) {
    await this.sendServerRequest(
      `/teams/${options.teamId}/users/${options.userId}?server=true`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }

  async removeUserFromTeam(options: {
    userId: string, 
    teamId: string,
  }) {
    await this.sendServerRequest(
      `/teams/${options.teamId}/users/${options.userId}?server=true`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }

  async listAnyTeamPermissions(): Promise<ServerPermissionJson[]> {
    const response = await this.sendServerRequest(`/teams/permissions?server=true&scope=any-team`, {}, null);
    return await response.json();
  }

  async setServerUserCustomizableData(userId: string, update: ServerUserUpdateJson) {
    await this.sendServerRequest(
      `/users/${userId}?server=true`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(update),
      },
      null,
    );
  }

  async deleteServerUser(userId: string) {
    await this.sendServerRequest(
      `/users/${userId}?server=true`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }
}
