import { ServerAuthApplicationOptions, StackServerInterface } from "./serverInterface";
import { ProjectJson, SharedProvider, StandardProvider, TokenStore } from "./clientInterface";
import { throwErr } from "../utils/errors";
import { ReadonlyJson } from "../utils/json";

export type AdminAuthApplicationOptions = Readonly<
  ServerAuthApplicationOptions &
  (
    | {
      superSecretAdminKey: string,
    }
    | {
      internalAdminAccessToken: string,
    }
  )
>

export type OauthProviderUpdateOptions = {
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
    tenantId?: string,
  }
)

export type ProjectUpdateOptions = Readonly<{
  isProductionMode?: boolean,
  config?: {
    domains?: {
      domain: string,
      handlerPath: string,
    }[],
    oauthProviders?: OauthProviderUpdateOptions[],
    credentialEnabled?: boolean,
    allowLocalhost?: boolean,
  },
}>

export type ApiKeySetBase = Readonly<{
  id: string,
  description: string,
  expiresAt: Date,
  manuallyRevokedAt: Date | null,
  createdAt: Date,
  isValid(): boolean,
  whyInvalid(): "expired" | "manually-revoked" | null,
}>

export type ApiKeySetBaseJson = Readonly<{
  id: string,
  description: string,
  expiresAtMillis: number,
  manuallyRevokedAtMillis: number | null,
  createdAtMillis: number,
}>

export type ApiKeySetFirstView = Readonly<
  ApiKeySetBase & {
    publishableClientKey?: string,
    secretServerKey?: string,
    superSecretAdminKey?: string,
  }
>

export type ApiKeySetFirstViewJson = Readonly<
  ApiKeySetBaseJson & {
    publishableClientKey?: string,
    secretServerKey?: string,
    superSecretAdminKey?: string,
  }
>

export type ApiKeySetSummary = Readonly<
  ApiKeySetBase & {
    publishableClientKey: null | {
      lastFour: string,
    },
    secretServerKey: null | {
      lastFour: string,
    },
    superSecretAdminKey: null | {
      lastFour: string,
    },
  }
>

export type ApiKeySetSummaryJson = Readonly<
  ApiKeySetBaseJson & {
    publishableClientKey: null | {
      lastFour: string,
    },
    secretServerKey: null | {
      lastFour: string,
    },
    superSecretAdminKey: null | {
      lastFour: string,
    },
  }
>

export class StackAdminInterface extends StackServerInterface {
  constructor(public readonly options: AdminAuthApplicationOptions) {
    super(options);
  }

  protected async sendAdminRequest(path: string, options: RequestInit, tokenStore: TokenStore | null) {
    return await this.sendServerRequest(
      path,
      {
        ...options,
        headers: {
          "x-stack-super-secret-admin-key": "superSecretAdminKey" in this.options ? this.options.superSecretAdminKey : "",
          ...options.headers,
        },
      },
      tokenStore,
    );
  }

  async getProject(options?: { showDisabledOauth?: boolean }): Promise<ProjectJson> {
    const response = await this.sendAdminRequest(
      "/projects/" + encodeURIComponent(this.projectId),
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

  async updateProject(update: ProjectUpdateOptions): Promise<ProjectJson> {
    const response = await this.sendAdminRequest(
      "/projects/" + encodeURIComponent(this.projectId),
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
    options: {
      hasPublishableClientKey: boolean,
      hasSecretServerKey: boolean,
      hasSuperSecretAdminKey: boolean,
      expiresAt: Date,
      description: string,
    },
  ): Promise<ApiKeySetFirstView> {
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
    return createApiKeySetFirstViewFromJson(await response.json());
  }

  async listApiKeySets(): Promise<ApiKeySetSummary[]> {
    const response = await this.sendAdminRequest("/api-keys", {}, null);
    const json = await response.json();
    return json.map((k: ApiKeySetSummaryJson) => createApiKeySetSummaryFromJson(k));
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

  async getApiKeySet(id: string, tokenStore: TokenStore): Promise<ApiKeySetSummary> {
    const response = await this.sendAdminRequest(`/api-keys/${id}`, {}, tokenStore);
    return await response.json();
  }
}

function createApiKeySetBaseFromJson(data: ApiKeySetBaseJson): ApiKeySetBase {
  return {
    id: data.id,
    description: data.description,
    expiresAt: new Date(data.expiresAtMillis),
    manuallyRevokedAt: data.manuallyRevokedAtMillis ? new Date(data.manuallyRevokedAtMillis) : null,
    createdAt: new Date(data.createdAtMillis),
    isValid() {
      return this.whyInvalid() === null;
    },
    whyInvalid() {
      if (this.expiresAt.getTime() < Date.now()) return "expired";
      if (this.manuallyRevokedAt) return "manually-revoked";
      return null;
    },
  };
}

function createApiKeySetSummaryFromJson(data: ApiKeySetSummaryJson): ApiKeySetSummary {
  return {
    ...createApiKeySetBaseFromJson(data),
    publishableClientKey: data.publishableClientKey ? { lastFour: data.publishableClientKey.lastFour } : null,
    secretServerKey: data.secretServerKey ? { lastFour: data.secretServerKey.lastFour } : null,
    superSecretAdminKey: data.superSecretAdminKey ? { lastFour: data.superSecretAdminKey.lastFour } : null,
  };
}

function createApiKeySetFirstViewFromJson(data: ApiKeySetFirstViewJson): ApiKeySetFirstView {
  return {
    ...createApiKeySetBaseFromJson(data),
    publishableClientKey: data.publishableClientKey,
    secretServerKey: data.secretServerKey,
    superSecretAdminKey: data.superSecretAdminKey,
  };
}
