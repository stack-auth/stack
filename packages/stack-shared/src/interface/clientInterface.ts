import * as oauth from 'oauth4webapi';
import crypto from "crypto";

import { Result } from "../utils/results";
import { ReadonlyJson } from '../utils/json';
import { AsyncStore, ReadonlyAsyncStore } from '../utils/stores';
import { KnownError, KnownErrors } from '../known-errors';
import { StackAssertionError } from '../utils/errors';

type UserCustomizableJson = {
  readonly displayName: string | null,
  readonly clientMetadata: ReadonlyJson,
};

export type UserJson = UserCustomizableJson & {
  readonly projectId: string,
  readonly id: string,
  readonly primaryEmail: string | null,
  readonly primaryEmailVerified: boolean,
  readonly displayName: string | null,
  readonly clientMetadata: ReadonlyJson,
  readonly profileImageUrl: string | null,
  readonly signedUpAtMillis: number,
  /**
   * not used anymore, for backwards compatibility
   */
  readonly authMethod: "credential" | "oauth",
  readonly hasPassword: boolean,
  readonly authWithEmail: boolean,
  readonly oauthProviders: readonly string[],
};

export type UserUpdateJson = Partial<UserCustomizableJson>;

export type ClientProjectJson = {
  readonly id: string,
  readonly credentialEnabled: boolean,
  readonly magicLinkEnabled: boolean,
  readonly teamsEnabled: boolean,
  readonly oauthProviders: readonly {
    id: string,
    enabled: boolean,
  }[],
};

export type ClientInterfaceOptions = {
  readonly baseUrl: string,
  readonly projectId: string,
} & ({
  readonly publishableClientKey: string,
} | {
  readonly projectOwnerTokens: ReadonlyTokenStore,
});

export type SharedProvider = "shared-github" | "shared-google" | "shared-facebook" | "shared-microsoft";
export const sharedProviders = [
  "shared-github",
  "shared-google",
  "shared-facebook",
  "shared-microsoft",
] as const;

export type StandardProvider = "github" | "facebook" | "google" | "microsoft";
export const standardProviders = [
  "github",
  "facebook",
  "google",
  "microsoft",
] as const;

export function toStandardProvider(provider: SharedProvider | StandardProvider): StandardProvider {
  return provider.replace("shared-", "") as StandardProvider;
}

export function toSharedProvider(provider: SharedProvider | StandardProvider): SharedProvider {
  return "shared-" + provider as SharedProvider;
}


function getSessionCookieName(projectId: string) {
  return "__stack-token-" + crypto.createHash("sha256").update(projectId).digest("hex");
}

export type ReadonlyTokenStore = ReadonlyAsyncStore<TokenObject>;
export type TokenStore = AsyncStore<TokenObject>;

export type TokenObject = Readonly<{
  refreshToken: string | null,
  accessToken: string | null,
}>;

export type ProjectJson = {
  id: string,
  displayName: string,
  description?: string,
  createdAtMillis: number,
  userCount: number,
  isProductionMode: boolean,
  evaluatedConfig: {
    id: string,
    allowLocalhost: boolean,
    credentialEnabled: boolean,
    magicLinkEnabled: boolean,
    teamsEnabled: boolean,
    oauthProviders: OAuthProviderConfigJson[],
    emailConfig?: EmailConfigJson,
    domains: DomainConfigJson[],
  },
};

export type OAuthProviderConfigJson = {
  id: string,
  enabled: boolean,
} & (
  | { type: SharedProvider }
  | {
    type: StandardProvider,
    clientId: string,
    clientSecret: string,
    tenantId?: string,
  }
);

export type EmailConfigJson = (
  {
    type: "standard",
    senderName: string,
    senderEmail: string,
    host: string,
    port: number,
    username: string,
    password: string,
  }
  | {
    type: "shared",
    senderName: string,
  }
);

export type DomainConfigJson = {
  domain: string,
  handlerPath: string,
}

export type ProductionModeError = {
  errorMessage: string,
  fixUrlRelative: string,
};


export type OrglikeJson = {
  id: string,
  displayName: string,
  createdAtMillis: number,
};

export type TeamJson = OrglikeJson;

export type OrganizationJson = OrglikeJson;


export type PermissionDefinitionScopeJson =
  | { type: "global" }
  | { type: "any-team" }
  | { type: "specific-team", teamId: string };

export type PermissionDefinitionJson = {
  id: string,
  scope: PermissionDefinitionScopeJson,
};

export class StackClientInterface {
  constructor(public readonly options: ClientInterfaceOptions) {
    // nothing here
  }

  get projectId() {
    return this.options.projectId;
  }

  getSessionCookieName() {
    return getSessionCookieName(this.projectId);
  }

  getApiUrl() {
    return this.options.baseUrl + "/api/v1";
  }

  protected async refreshAccessToken(tokenStore: TokenStore) {
    if (!('publishableClientKey' in this.options)) {
      // TODO fix
      throw new Error("Admin session token is currently not supported for fetching new access token");
    }

    const refreshToken = (await tokenStore.getOrWait()).refreshToken;
    if (!refreshToken) {
      tokenStore.set({
        accessToken: null,
        refreshToken: null,
      });
      return;
    }
    
    const as = {
      issuer: this.options.baseUrl,
      algorithm: 'oauth2',
      token_endpoint: this.getApiUrl() + '/auth/token',
    };
    const client: oauth.Client = {
      client_id: this.projectId,
      client_secret: this.options.publishableClientKey,
      token_endpoint_auth_method: 'client_secret_basic',
    };

    const rawResponse = await oauth.refreshTokenGrantRequest(
      as,
      client,
      refreshToken,
    );
    const response = await this._processResponse(rawResponse);

    if (response.status === "error") {
      const error = response.error;
      if (error instanceof KnownErrors.RefreshTokenError) {
        return tokenStore.set({
          accessToken: null,
          refreshToken: null,
        });
      }
      throw error;
    }

    if (!response.data.ok) {
      const body = await response.data.text();
      throw new Error(`Failed to send refresh token request: ${response.status} ${body}`);
    }

    let challenges: oauth.WWWAuthenticateChallenge[] | undefined;
    if ((challenges = oauth.parseWwwAuthenticateChallenges(response.data))) {
      // TODO Handle WWW-Authenticate Challenges as needed
      throw new StackAssertionError("OAuth WWW-Authenticate challenge not implemented", { challenges });
    }

    const result = await oauth.processRefreshTokenResponse(as, client, response.data);
    if (oauth.isOAuth2Error(result)) {
      // TODO Handle OAuth 2.0 response body error
      throw new StackAssertionError("OAuth error", { result });
    }

    tokenStore.update(old => ({
      accessToken: result.access_token ?? null,
      refreshToken: result.refresh_token ?? old?.refreshToken ?? null,
    }));
  }

  protected async sendClientRequest(
    path: string, 
    requestOptions: RequestInit, 
    tokenStoreOrNull: TokenStore | null,
    requestType: "client" | "server" | "admin" = "client",
  ) {
    const tokenStore = tokenStoreOrNull ?? new AsyncStore<TokenObject>({
      accessToken: null,
      refreshToken: null,
    });


    return await Result.orThrowAsync(
      Result.retry(
        () => this.sendClientRequestInner(path, requestOptions, tokenStore!, requestType),
        5,
        { exponentialDelayBase: 1000 },
      )
    );
  }

  protected async sendClientRequestAndCatchKnownError<E extends typeof KnownErrors[keyof KnownErrors]>(
    path: string, 
    requestOptions: RequestInit, 
    tokenStoreOrNull: TokenStore | null,
    errorsToCatch: readonly E[],
  ): Promise<Result<
    Response & {
      usedTokens: TokenObject,
    },
    InstanceType<E>
  >> {
    try {
      return Result.ok(await this.sendClientRequest(path, requestOptions, tokenStoreOrNull));
    } catch (e) {
      for (const errorType of errorsToCatch) {
        if (e instanceof errorType) {
          return Result.error(e as InstanceType<E>);
        }
      }
      throw e;
    }
  }

  private async sendClientRequestInner(
    path: string,
    options: RequestInit,
    /**
     * This object will be modified for future retries, so it should be passed by reference.
     */
    tokenStore: TokenStore,
    requestType: "client" | "server" | "admin",
  ): Promise<Result<Response & {
    usedTokens: TokenObject,
  }>> {
    let tokenObj = await tokenStore.getOrWait();
    if (!tokenObj.accessToken && tokenObj.refreshToken) {
      await this.refreshAccessToken(tokenStore);
      tokenObj = await tokenStore.getOrWait();
    }

    const url = this.getApiUrl() + path;
    const params: RequestInit = {
      /**
       * This fetch may be cross-origin, in which case we don't want to send cookies of the
       * original origin (this is the default behaviour of `credentials`).
       * 
       * To help debugging, also omit cookies on same-origin, so we don't accidentally
       * implement reliance on cookies anywhere.
       */
      credentials: "omit",
      ...options,
      headers: {
        "X-Stack-Override-Error-Status": "true",
        "X-Stack-Project-Id": this.projectId,
        "X-Stack-Request-Type": requestType,
        ...tokenObj.accessToken ? {
          "Authorization": "StackSession " + tokenObj.accessToken,
        } : {},
        ...'publishableClientKey' in this.options ? {
          "X-Stack-Publishable-Client-Key": this.options.publishableClientKey,
        } : {},
        ...'projectOwnerTokens' in this.options ? {
          "X-Stack-Admin-Access-Token": (await this.options.projectOwnerTokens?.getOrWait())?.accessToken ?? "",
        } : {},
        ...options.headers,
      },
    };

    const rawRes = await fetch(url, params);
    const processedRes = await this._processResponse(rawRes);
    if (processedRes.status === "error") {
      // If the access token is expired, reset it and retry
      if (processedRes.error instanceof KnownErrors.InvalidAccessToken) {
        tokenStore.set({
          accessToken: null,
          refreshToken: tokenObj.refreshToken,
        });
        return Result.error(new Error("Access token expired"));
      }

      // Known errors are client side errors, and should hence not be retried (except for access token expired above).
      // Hence, throw instead of returning an error
      throw processedRes.error;
    }


    const res = Object.assign(processedRes.data, {
      usedTokens: tokenObj,
    });
    if (res.ok) {
      return Result.ok(res);
    } else {
      const error = await res.text();

      // Do not retry, throw error instead of returning one
      throw new Error(`Failed to send request to ${url}: ${res.status} ${error}`);
    }
  }

  private async _processResponse(rawRes: Response): Promise<Result<Response, KnownError>> {
    let res = rawRes;
    if (rawRes.headers.has("x-stack-actual-status")) {
      const actualStatus = Number(rawRes.headers.get("x-stack-actual-status"));
      res = new Response(rawRes.body, {
        status: actualStatus,
        statusText: rawRes.statusText,
        headers: rawRes.headers,
      });
    }

    // Handle known errors
    if (res.headers.has("x-stack-known-error")) {
      const errorJson = await res.json();
      if (res.headers.get("x-stack-known-error") !== errorJson.code) {
        throw new Error("Mismatch between x-stack-known-error header and error code in body; the server's response is invalid");
      }
      const error = KnownError.fromJson(errorJson);
      return Result.error(error);
    }

    return Result.ok(res);
  }

  async sendForgotPasswordEmail(
    email: string,
    redirectUrl: string,
  ): Promise<KnownErrors["UserNotFound"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          redirectUrl,
        }),
      },
      null,
      [KnownErrors.UserNotFound],
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async sendVerificationEmail(
    emailVerificationRedirectUrl: string, 
    tokenStore: TokenStore
  ): Promise<KnownErrors["EmailAlreadyVerified"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/send-verification-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emailVerificationRedirectUrl,
        }),
      },
      tokenStore,
      [KnownErrors.EmailAlreadyVerified]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async sendMagicLinkEmail(
    email: string, 
    redirectUrl: string,
  ): Promise<KnownErrors["RedirectUrlNotWhitelisted"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/send-magic-link",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          redirectUrl,
        }),
      },
      null,
      [KnownErrors.RedirectUrlNotWhitelisted]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async resetPassword(
    options: { code: string } & ({ password: string } | { onlyVerifyCode: boolean })
  ): Promise<KnownErrors["PasswordResetError"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/password-reset",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(options),
      },
      null,
      [KnownErrors.PasswordResetError]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async updatePassword(
    options: { oldPassword: string, newPassword: string }, 
    tokenStore: TokenStore
  ): Promise<KnownErrors["PasswordMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/update-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(options),
      },
      tokenStore,
      [KnownErrors.PasswordMismatch, KnownErrors.PasswordRequirementsNotMet]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async verifyPasswordResetCode(code: string): Promise<KnownErrors["PasswordResetCodeError"] | undefined> {
    const res = await this.resetPassword({ code, onlyVerifyCode: true });
    if (res && !(res instanceof KnownErrors.PasswordResetCodeError)) {
      throw res;
    }
    return res;
  }

  async verifyEmail(code: string): Promise<KnownErrors["EmailVerificationError"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/email-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
        }),
      },
      null,
      [KnownErrors.EmailVerificationError]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async signInWithCredential(
    email: string, 
    password: string, 
    tokenStore: TokenStore
  ): Promise<KnownErrors["EmailPasswordMismatch"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/signin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
      tokenStore,
      [KnownErrors.EmailPasswordMismatch]
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    tokenStore.set({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  async signUpWithCredential(
    email: string,
    password: string,
    emailVerificationRedirectUrl: string,
    tokenStore: TokenStore,
  ): Promise<KnownErrors["UserEmailAlreadyExists"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/signup",
      {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          emailVerificationRedirectUrl,
        }),
      },
      tokenStore,
      [KnownErrors.UserEmailAlreadyExists]
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    tokenStore.set({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  async signInWithMagicLink(code: string, tokenStore: TokenStore): Promise<KnownErrors["MagicLinkError"] | { newUser: boolean }> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/magic-link-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
        }),
      },
      null,
      [KnownErrors.MagicLinkError]
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    tokenStore.set({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return { newUser: result.newUser };
  }

  async getOAuthUrl(
    provider: string, 
    redirectUrl: string, 
    codeChallenge: string, 
    state: string
  ): Promise<string> {
    const updatedRedirectUrl = new URL(redirectUrl);
    for (const key of ["code", "state"]) {
      if (updatedRedirectUrl.searchParams.has(key)) {
        console.warn("Redirect URL already contains " + key + " parameter, removing it as it will be overwritten by the OAuth callback");
      }
      updatedRedirectUrl.searchParams.delete(key);
    }

    if (!('publishableClientKey' in this.options)) {
      // TODO fix
      throw new Error("Admin session token is currently not supported for OAuth");
    }
    const url = new URL(this.getApiUrl() + "/auth/authorize/" + provider.toLowerCase());
    url.searchParams.set("client_id", this.projectId);
    url.searchParams.set("client_secret", this.options.publishableClientKey);
    url.searchParams.set("redirect_uri", updatedRedirectUrl.toString());
    url.searchParams.set("scope", "openid");
    url.searchParams.set("state", state);
    url.searchParams.set("grant_type", "authorization_code");
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("response_type", "code");
    return url.toString();
  }

  async callOAuthCallback(
    oauthParams: URLSearchParams, 
    redirectUri: string,
    codeVerifier: string, 
    state: string,
    tokenStore: TokenStore,
  ) {
    if (!('publishableClientKey' in this.options)) {
      // TODO fix
      throw new Error("Admin session token is currently not supported for OAuth");
    }
    const as = {
      issuer: this.options.baseUrl,
      algorithm: 'oauth2',
      token_endpoint: this.getApiUrl() + '/auth/token',
    };
    const client: oauth.Client = {
      client_id: this.projectId,
      client_secret: this.options.publishableClientKey,
      token_endpoint_auth_method: 'client_secret_basic',
    };
    const params = oauth.validateAuthResponse(as, client, oauthParams, state);
    if (oauth.isOAuth2Error(params)) {
      throw new StackAssertionError("Error validating OAuth response", { params }); // Handle OAuth 2.0 redirect error
    }
    const response = await oauth.authorizationCodeGrantRequest(
      as,
      client,
      params,
      redirectUri,
      codeVerifier,
    );

    let challenges: oauth.WWWAuthenticateChallenge[] | undefined;
    if ((challenges = oauth.parseWwwAuthenticateChallenges(response))) {
      // TODO Handle WWW-Authenticate Challenges as needed
      throw new StackAssertionError("OAuth WWW-Authenticate challenge not implemented", { challenges });
    }

    const result = await oauth.processAuthorizationCodeOAuth2Response(as, client, response);
    if (oauth.isOAuth2Error(result)) {
      // TODO Handle OAuth 2.0 response body error
      throw new StackAssertionError("OAuth error", { result });
    }
    tokenStore.update(old => ({
      accessToken: result.access_token ?? null,
      refreshToken: result.refresh_token ?? old?.refreshToken ?? null,
    }));

    return result;
  }

  async signOut(tokenStore: TokenStore): Promise<void> {
    const tokenObj = await tokenStore.getOrWait();
    const res = await this.sendClientRequest(
      "/auth/signout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          refreshToken: tokenObj.refreshToken ?? "",
        }),
      },
      tokenStore,
    );
    await res.json();
    tokenStore.set({
      accessToken: null,
      refreshToken: null,
    });
  }

  async getClientUserByToken(tokenStore: TokenStore): Promise<Result<UserJson>> {
    const response = await this.sendClientRequest(
      "/current-user",
      {},
      tokenStore,
    );
    const user: UserJson | null = await response.json();
    if (!user) return Result.error(new Error("Failed to get user"));
    return Result.ok(user);
  }

  async listClientUserPermissions(tokenStore: TokenStore): Promise<PermissionDefinitionJson[]> {
    const response = await this.sendClientRequest(
      "/current-user/permissions",
      {},
      tokenStore,
    );
    const permissions: PermissionDefinitionJson[] = await response.json();
    return permissions;
  }

  async listClientUserTeams(tokenStore: TokenStore): Promise<TeamJson[]> {
    const response = await this.sendClientRequest(
      "/current-user/teams",
      {},
      tokenStore,
    );
    const teams: TeamJson[] = await response.json();
    return teams;
  }

  async getClientProject(): Promise<Result<ClientProjectJson>> {
    const response = await this.sendClientRequest("/projects/" + this.options.projectId, {}, null);
    const project: ClientProjectJson | null = await response.json();
    if (!project) return Result.error(new Error("Failed to get project"));
    return Result.ok(project);
  }

  async setClientUserCustomizableData(update: UserUpdateJson, tokenStore: TokenStore) {
    await this.sendClientRequest(
      "/current-user",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(update),
      },
      tokenStore,
    );
  }

  async listProjects(tokenStore: TokenStore): Promise<ProjectJson[]> {
    const response = await this.sendClientRequest("/projects", {}, tokenStore);
    if (!response.ok) {
      throw new Error("Failed to list projects: " + response.status + " " + (await response.text()));
    }

    const json = await response.json();
    return json;
  }

  async createProject(
    project: Pick<ProjectJson, "displayName" | "description">,
    tokenStore: TokenStore,
  ): Promise<ProjectJson> {
    const fetchResponse = await this.sendClientRequest(
      "/projects",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(project),
      },
      tokenStore,
    );
    if (!fetchResponse.ok) {
      throw new Error("Failed to create project: " + fetchResponse.status + " " + (await fetchResponse.text()));
    }

    const json = await fetchResponse.json();
    return json;
  }
}

export function getProductionModeErrors(project: ProjectJson): ProductionModeError[] {
  const errors: ProductionModeError[] = [];
  const fixUrlRelative = `/projects/${encodeURIComponent(project.id)}/auth/urls-and-callbacks`;

  if (project.evaluatedConfig.allowLocalhost) {
    errors.push({
      errorMessage: "Localhost is not allowed in production mode, turn off 'Allow localhost' in project settings",
      fixUrlRelative,
    });
  }

  for (const { domain } of project.evaluatedConfig.domains) {
    let url;
    try {
      url = new URL(domain);
    } catch (e) {
      errors.push({
        errorMessage: "Domain should be a valid URL: " + domain,
        fixUrlRelative,
      });
      continue;
    }

    if (url.hostname === "localhost") {
      errors.push({
        errorMessage: "Domain should not be localhost: " + domain,
        fixUrlRelative,
      });
    } else if (!url.hostname.includes(".") || url.hostname.match(/\d+(\.\d+)*/)) {
      errors.push({
        errorMessage: "Not a valid domain" + domain,
        fixUrlRelative,
      });
    } else if (url.protocol !== "https:") {
      errors.push({
        errorMessage: "Domain should be HTTPS: " + domain,
        fixUrlRelative,
      });
    }
  }

  return errors;
}

