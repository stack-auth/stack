import { 
  ClientInterfaceOptions, 
  UserCustomizableJson, 
  UserJson, 
  TokenStore, 
  StackClientInterface, 
} from "./clientInterface";
import { Result } from "../utils/results";
import { AsyncCache } from "../utils/caches";
import { runAsynchronously } from "../utils/promises";
import { ReadonlyJson } from "../utils/json";

export type ServerUserJson = UserJson & {
  readonly serverMetadata: ReadonlyJson,
};

export type ServerUserCustomizableJson = UserCustomizableJson & {
  readonly serverMetadata: ReadonlyJson,
  readonly primaryEmail: string | null,
  readonly primaryEmailVerified: boolean,
}


export type ServerAuthApplicationOptions = (
  & ClientInterfaceOptions
  & (
    | {
      readonly secretServerKey: string,
    }
    | {
      readonly internalAdminAccessToken: string,
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

  async setServerUserCustomizableData(userId: string, update: Partial<ServerUserCustomizableJson>) {
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
