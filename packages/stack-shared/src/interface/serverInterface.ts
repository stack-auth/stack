import { 
  ClientInterfaceOptions, 
  UserJson, 
  TokenStore, 
  StackClientInterface,
  ReadonlyTokenStore,
  OrglikeJson,
  UserUpdateJson,
  PermissionDefinitionJson,
  PermissionDefinitionScopeJson as PermissionDefinitionScopeJson,
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

export type ServerPermissionDefinitionCustomizableJson = {
  readonly id: string,
  readonly description?: string,
  readonly scope: PermissionDefinitionScopeJson,
  readonly containPermissionIds: string[],
};

export type ServerPermissionDefinitionJson = PermissionDefinitionJson & ServerPermissionDefinitionCustomizableJson & {
  readonly __databaseUniqueId: string,
  readonly scope: PermissionDefinitionScopeJson,
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

  protected async sendServerRequest(path: string, options: RequestInit, tokenStore: TokenStore | null, requestType: "server" | "admin" = "server") {
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
      requestType,
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

  async listPermissionDefinitions(): Promise<ServerPermissionDefinitionJson[]> {
    const response = await this.sendServerRequest(`/permission-definitions?server=true`, {}, null);
    return await response.json();
  }

  async createPermissionDefinition(data: ServerPermissionDefinitionCustomizableJson): Promise<ServerPermissionDefinitionJson> {
    const response = await this.sendServerRequest(
      "/permission-definitions?server=true",
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

  async updatePermissionDefinition(permissionId: string, data: Partial<ServerPermissionDefinitionCustomizableJson>): Promise<void> {
    await this.sendServerRequest(
      `/permission-definitions/${permissionId}?server=true`,
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

  async deletePermissionDefinition(permissionId: string): Promise<void> {
    await this.sendServerRequest(
      `/permission-definitions/${permissionId}?server=true`,
      { method: "DELETE" },
      null,
    );
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

  async listTeamUserPermissions(
    options: {
      teamId: string, 
      userId: string, 
      type: 'global' | 'team', 
      direct: boolean,
    }
  ): Promise<ServerPermissionDefinitionJson[]> {
    const response = await this.sendServerRequest(
      `/teams/${options.teamId}/users/${options.userId}/permissions?server=true&type=${options.type}&direct=${options.direct}`, 
      {}, 
      null
    );
    return await response.json();
  }

  async grantTeamUserPermission(teamId: string, userId: string, permissionId: string, type: 'global' | 'team') {
    await this.sendServerRequest(
      `/teams/${teamId}/users/${userId}/permissions/${permissionId}?server=true`,
      { 
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ type }),
      },
      null,
    );
  }

  async revokeTeamUserPermission(teamId: string, userId: string, permissionId: string, type: 'global' | 'team') {
    await this.sendServerRequest(
      `/teams/${teamId}/users/${userId}/permissions/${permissionId}?server=true`,
      { 
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ type }),
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
