import { 
  ClientInterfaceOptions, 
  UserCustomizableJson, 
  UserJson, 
  TokenStore, 
  StackClientInterface, 
} from "./clientInterface";
import { Result } from "../utils/results";
import { ReadonlyJson } from "../utils/types";
import { AsyncCache } from "../utils/caches";
import { runAsynchronously } from "../utils/promises";

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
  // note that we intentionally use TokenStore (a reference type) as a key, as different token stores with the same tokens should be treated differently
  // (if we wouldn't do that, we would cache users across requests, which may cause caching issues)
  public readonly currentServerUserCache: AsyncCache<TokenStore, ServerUserJson | null>;

  constructor(public override options: ServerAuthApplicationOptions) {
    super(options);
    this.currentServerUserCache = new AsyncCache(async (key, isFirst) => {
      if (isFirst) {
        key.onChange((newValue, oldValue) => {
          if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
          runAsynchronously(this.currentServerUserCache.refresh(key));
        });
      }
      const user = await this.getServerUserByToken(key);
      return Result.or(user, null);
    });
    // TODO override the client user cache to use the server user cache, so we save some requests
  }

  override async refreshUser(tokenStore: TokenStore) {
    await Promise.all([
      super.refreshUser(tokenStore),
      this.currentServerUserCache.refresh(tokenStore),
    ]);
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
