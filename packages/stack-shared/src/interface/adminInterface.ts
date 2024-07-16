import { InternalSession } from "../sessions";
import { ApiKeysCrud } from "./crud/api-keys";
import { ProjectsCrud } from "./crud/projects";
import { ServerAuthApplicationOptions, StackServerInterface } from "./serverInterface";

export type AdminAuthApplicationOptions = ServerAuthApplicationOptions &(
  | {
    superSecretAdminKey: string,
  }
  | {
    projectOwnerSession: InternalSession,
  }
);

export type ApiKeySetCreateOptions = {
  has_publishable_client_key: boolean,
  has_secret_server_key: boolean,
  has_super_secret_admin_key: boolean,
  expires_at: Date,
  description: string,
};

export type ApiKeySetFirstViewJson = ApiKeysCrud["Admin"]["Read"] & {
  publishable_client_key?: string,
  secret_server_key?: string,
  super_secret_admin_key?: string,
};

// TODO next-release: remove comment
/*

export type OAuthProviderUpdateOptions = {
  id: string,
  enabled: boolean,
} & (
  | {
    type: SharedProvider,
  }
  | {
    type: StandardProvider,
    clientId: string,
    clientSecret: string,
  }
)

export type ProjectUpdateOptions = {
  displayName?: string,
  description?: string,
  isProductionMode?: boolean,
  config?: {
    domains?: {
      domain: string,
      handlerPath: string,
    }[],
    oauthProviders?: OAuthProviderUpdateOptions[],
    credentialEnabled?: boolean,
    magicLinkEnabled?: boolean,
    allowLocalhost?: boolean,
    createTeamOnSignUp?: boolean,
    emailConfig?: EmailConfigJson,
    teamCreatorDefaultPermissionIds?: string[],
    teamMemberDefaultPermissionIds?: string[],
  },
};

export type ApiKeySetJson = ApiKeySetBaseJson & {
  publishableClientKey: null | {
    lastFour: string,
  },
  secretServerKey: null | {
    lastFour: string,
  },
  superSecretAdminKey: null | {
    lastFour: string,
  },
};
*/

export class StackAdminInterface extends StackServerInterface {
  constructor(public readonly options: AdminAuthApplicationOptions) {
    super(options);
  }

  protected async sendAdminRequest(path: string, options: RequestInit, session: InternalSession | null, requestType: "admin" = "admin") {
    return await this.sendServerRequest(
      path,
      {
        ...options,
        headers: {
          "x-stack-super-secret-admin-key": "superSecretAdminKey" in this.options ? this.options.superSecretAdminKey : "",
          ...options.headers,
        },
      },
      session,
      requestType,
    );
  }

  async getProject(options?: { showDisabledOAuth?: boolean }): Promise<ProjectsCrud["Admin"]["Read"]> {
    const response = await this.sendAdminRequest(
      "/projects/current",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(options ?? {}),
      },
      null,
    );
    return await response.json();
  }

  async updateProject(update: ProjectsCrud["Admin"]["Update"]): Promise<ProjectsCrud["Admin"]["Read"]> {
    const response = await this.sendAdminRequest(
      "/projects/current",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(update),
      },
      null,
    );
    return await response.json();
  }

  async createApiKeySet(
    options: ApiKeySetCreateOptions,
  ): Promise<ApiKeySetFirstViewJson> {
    const response = await this.sendServerRequest(
      "/api-keys",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(options),
      },
      null,
    );
    return await response.json();
  }

  async listApiKeySets(): Promise<ApiKeysCrud["Admin"]["Read"][]> {
    const response = await this.sendAdminRequest("/api-keys", {}, null);
    return await response.json();
  }

  async revokeApiKeySetById(id: string) {
    await this.sendAdminRequest(
      `/api-keys/${id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          revoke: true,
        }),
      },
      null,
    );
  }

  async getApiKeySet(id: string, session: InternalSession): Promise<ApiKeysCrud["Admin"]["Read"]> {
    const response = await this.sendAdminRequest(`/api-keys/${id}`, {}, session);
    return await response.json();
  }
}

