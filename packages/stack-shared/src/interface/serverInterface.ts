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
  readonly team: ServerTeamJson | null,
};

export type ServerUserUpdateJson = UserUpdateJson & {
  readonly serverMetadata?: ReadonlyJson,
  readonly primaryEmail?: string | null,
  readonly primaryEmailVerified?: boolean,
  readonly teamId?: string | null,
}

export type ServerOrglikeCustomizableJson = Pick<ServerOrglikeJson, "displayName">;
export type ServerOrglikeJson = OrglikeJson & {};

export type ServerTeamCustomizableJson = ServerOrglikeCustomizableJson;
export type ServerTeamJson = ServerOrglikeJson;

export type ServerPermissionCreateJson = {
  readonly databaseUniqueId: string,
  readonly id: string,
  readonly scope: PermissionScopeJson,
  readonly displayName: string,
  readonly description: string,
  readonly inheritFromPermissionIds: string[],
};

export type ServerPermissionJson = PermissionJson & ServerPermissionCreateJson & {};


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

  async listUsers(): Promise<ServerUserJson[]> {
    const response = await this.sendServerRequest("/users?server=true", {}, null);
    return await response.json();
  }

  async listTeams(): Promise<ServerTeamJson[]> {
    const response = await this.sendServerRequest("/teams?server=true", {}, null);
    return await response.json();
  }

  async addUserToTeam(userId: string, teamId: string) {
    await this.sendServerRequest(
      `/teams/${teamId}/users/${userId}?server=true`,
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

  async removeUserFromTeam(userId: string, teamId: string) {
    await this.sendServerRequest(
      `/teams/${teamId}/users/${userId}?server=true`,
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
