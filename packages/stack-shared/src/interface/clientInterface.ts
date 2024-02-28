import * as oauth from 'oauth4webapi';
import crypto from "crypto";

import { 
  AccessTokenExpiredErrorCode, 
  ReadonlyJson, 
  GrantInvalidErrorCode, 
  SignInErrorCode, 
  SignUpErrorCode, 
  KnownErrorCodes,
  KnownError,
  SignUpErrorCodes,
  SignInErrorCodes,
  EmailVerificationLinkErrorCode,
  EmailVerificationLinkErrorCodes,
  PasswordResetLinkErrorCodes,
  PasswordResetLinkErrorCode
} from "../utils/types";
import { Result } from "../utils/results";
import { parseJson } from '../utils/json';
import { AsyncCache, AsyncValueCache } from '../utils/caches';
import { typedAssign } from '../utils/objects';
import { AsyncStore } from '../utils/stores';
import { runAsynchronously } from '../utils/promises';

export type UserCustomizableJson = {
  readonly projectId: string,
  readonly displayName: string | null,
  readonly clientMetadata: ReadonlyJson,
};

export type UserJson = UserCustomizableJson & {
  readonly id: string,
  readonly primaryEmail: string | null,
  readonly primaryEmailVerified: boolean,
  readonly displayName: string | null,
  readonly clientMetadata: ReadonlyJson,
  readonly profileImageUrl: string | null,
  readonly signedUpAtMillis: number,
};

export type ClientProjectJson = {
  readonly id: string,
  readonly oauthProviders: readonly {
    id: string,
  }[],
};

export type ClientInterfaceOptions = {
  readonly baseUrl: string,
  readonly projectId: string,
} & ({
  readonly publishableClientKey: string,
} | {
  readonly internalAdminAccessToken: string,
});


function getSessionCookieName(projectId: string) {
  return "__stack-token-" + crypto.createHash("sha256").update(projectId).digest("hex");
}

async function catchAndThrowKnownError<E>(
  fn: () => Promise<any>,
  codes: string[],
): Promise<Result<any, E>> {
  try {
    return Result.ok(await fn());
  } catch (e) {
    if (e instanceof KnownError && codes.includes(e.errorCode)) {
      return Result.error(e.errorCode as E);
    }
    throw e;
  }
}

export type TokenStore = AsyncStore<TokenObject>;

export type TokenObject = Readonly<{
  refreshToken: string | null,
  accessToken: string | null,
}>;

export type ProjectJson = Readonly<{
  id: string,
  displayName: string,
  description?: string,
  createdAtMillis: number,
  userCount: number,
  isProductionMode: boolean,
  evaluatedConfig: {
    id: string,
    allowLocalhost: boolean,
    oauthProviders: OauthProviderConfigJson[],
    emailConfig?: EmailConfigJson,
    domains: DomainConfigJson[],
  },
}>;

export type OauthProviderConfigJson = {
  id: string,
} & (
  | {
    type:
      | "shared-github"
      | "shared-google"
      | "shared-facebook"
      | "shared-slack"
      | "shared-twitter"
      | "shared-linkedin"
      | "shared-microsoft",
  }
  | {
    type:
      | "github"
      | "facebook"
      | "slack"
      | "twitter"
      | "linkedin"
      | "google"
      | "microsoft",
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

export class StackClientInterface {
  // note that we intentionally use TokenStore (a reference type) as a key, as different token stores with the same tokens should be treated differently
  // (if we wouldn't do that, we would cache users across requests, which may cause caching issues)
  public readonly currentUserCache: AsyncCache<TokenStore, UserJson | null>;
  public readonly clientProjectCache: AsyncValueCache<ClientProjectJson>;

  constructor(public readonly options: ClientInterfaceOptions) {
    this.currentUserCache = new AsyncCache(async (key, isFirst) => {
      if (isFirst) {
        key.onChange((newValue, oldValue) => {
          if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
          runAsynchronously(this.currentUserCache.refresh(key));
        });
      }
      const user = await this.getClientUserByToken(key);
      return Result.or(user, null);
    });
    this.clientProjectCache = new AsyncValueCache(async () => {
      return Result.orThrow(await this.getClientProject());
    });
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

  async refreshUser(tokenStore: TokenStore) {
    await this.currentUserCache.refresh(tokenStore);
  }

  async refreshProject() {
    await this.clientProjectCache.refresh();
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

    const response = await oauth.refreshTokenGrantRequest(
      as,
      client,
      refreshToken,
    );

    if (!response.ok) {
      const error = await response.text();
      let errorJsonResult = parseJson(error);
      if (response.status === 401
        && errorJsonResult.status === "ok"
        && errorJsonResult.data
        && (errorJsonResult.data as any).error_code === GrantInvalidErrorCode
      ) {
        return tokenStore.set({
          accessToken: null,
          refreshToken: null,
        });
      }
      throw new Error(`Failed to send refresh token request: ${response.status} ${error}`);
    }
    
    let challenges: oauth.WWWAuthenticateChallenge[] | undefined;
    if ((challenges = oauth.parseWwwAuthenticateChallenges(response))) {
      for (const challenge of challenges) {
        console.error('WWW-Authenticate Challenge', challenge);
      }
      throw new Error(); // Handle WWW-Authenticate Challenges as needed
    }

    const result = await oauth.processRefreshTokenResponse(as, client, response);
    if (oauth.isOAuth2Error(result)) {
      console.error('Error Response', result);
      throw new Error(); // Handle OAuth 2.0 response body error
    }

    tokenStore.update(old => ({
      accessToken: result.access_token ?? null,
      refreshToken: result.refresh_token ?? old?.refreshToken ?? null,
    }));
  }

  protected async sendClientRequest(path: string, requestOptions: RequestInit, tokenStoreOrNull: TokenStore | null) {
    const tokenStore = tokenStoreOrNull ?? new AsyncStore<TokenObject>({
      accessToken: null,
      refreshToken: null,
    });

    return await Result.orThrowAsync(
      Result.retry(
        () => this.sendClientRequestInner(path, requestOptions, tokenStore!),
        5,
        { exponentialDelayBase: 1000 },
      )
    );
  }

  private async sendClientRequestInner(
    path: string,
    options: RequestInit,
    /**
     * This object will be modified for future retries, so it should be passed by reference.
     */
    tokenStore: TokenStore,
  ): Promise<Result<Response & {
    usedTokens: TokenObject,
  }>> {
    let tokenObj = await tokenStore.getOrWait();
    if (!tokenObj.accessToken && tokenObj.refreshToken) {
      await this.refreshAccessToken(tokenStore);
      tokenObj = await tokenStore.getOrWait();
    }

    const url = this.getApiUrl() + path;
    const params = {
      ...options,
      headers: {
        ...tokenObj.accessToken ? {
          "authorization": "StackSession " + tokenObj.accessToken,
        } : {},
        "x-stack-project-id": this.projectId,
        ...'publishableClientKey' in this.options ? {
          "x-stack-publishable-client-key": this.options.publishableClientKey,
        } : {},
        ...'internalAdminAccessToken' in this.options ? {
          "x-stack-admin-access-token": this.options.internalAdminAccessToken,
        } : {},
        ...options.headers,
      },
    };

    const res = await fetch(url, params);
    typedAssign(res, {
      usedTokens: tokenObj,
    });

    if (res.ok) {
      return Result.ok(res);
    } else {
      const error = await res.text();
      let errorJsonResult = parseJson(error);

      if (
        res.status === 401
        && errorJsonResult.status === "ok"
        && errorJsonResult.data
        && (errorJsonResult.data as any).error_code === AccessTokenExpiredErrorCode
      ) {
        tokenStore.set({
          accessToken: null,
          refreshToken: tokenObj.refreshToken,
        });
        return Result.error(new Error("Access token expired"));
      }

      if (
        res.status >= 400 && res.status <= 599
        && errorJsonResult.status === "ok"
        && errorJsonResult.data
        && KnownErrorCodes.includes((errorJsonResult.data as any).error_code)
      ) {
        throw new KnownError((errorJsonResult.data as any).error_code);
      }
      // Do not retry, throw error instead of returning one
      throw new Error(`Failed to send request to ${url}: ${res.status} ${error}`);
    }
  }

  async sendForgotPasswordEmail(
    email: string, 
    redirectUrl: string
  ): Promise<PasswordResetLinkErrorCode | undefined> {
    const result = await catchAndThrowKnownError<PasswordResetLinkErrorCode>(
      async () => await this.sendClientRequest(
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
      ),
      PasswordResetLinkErrorCodes
    );

    if (result.status === "error") {
      return result.error;
    }
  }

  async resetPassword(options: { password: string, code: string }): Promise<PasswordResetLinkErrorCode | undefined> {
    const result = await catchAndThrowKnownError<PasswordResetLinkErrorCode>(
      async () => await this.sendClientRequest(
        "/auth/password-reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(options),
        },
        null,
      ),
      PasswordResetLinkErrorCodes
    );

    if (result.status === "error") {
      return result.error;
    }
  }

  async verifyPasswordResetCode(code: string): Promise<PasswordResetLinkErrorCode | undefined> {
    const result = await catchAndThrowKnownError<PasswordResetLinkErrorCode>(
      async () => await this.sendClientRequest(
        "/auth/password-reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code,
            onlyVerifyCode: true,
          }),
        },
        null,
      ),
      PasswordResetLinkErrorCodes
    );

    if (result.status === "error") {
      return result.error;
    }
  }

  async verifyEmail(code: string): Promise<EmailVerificationLinkErrorCode | undefined> {
    const result = await catchAndThrowKnownError<EmailVerificationLinkErrorCode>(
      async () => {
        await this.sendClientRequest(
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
        );
      },
      EmailVerificationLinkErrorCodes
    );

    if (result.status === "error") {
      return result.error;
    }
  }

  async signInWithCredential(
    email: string, 
    password: string, 
    tokenStore: TokenStore
  ): Promise<SignInErrorCode | undefined> {
    const result = await catchAndThrowKnownError<SignInErrorCode>(
      async () => await this.sendClientRequest(
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
      ), 
      SignInErrorCodes
    );

    if (result.status === "error") {
      return result.error;
    }
    
    tokenStore.set({
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
    });
    await this.refreshUser(tokenStore);
  }

  async signUpWithCredential(
    email: string,
    password: string,
    emailVerificationRedirectUrl: string,
    tokenStore: TokenStore,
  ): Promise<SignUpErrorCode | undefined> {
    const result = await catchAndThrowKnownError<SignUpErrorCode>(
      async () => await this.sendClientRequest(
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
      ), 
      SignUpErrorCodes
    );

    if (result.status === "error") {
      return result.error;
    }

    tokenStore.set({
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
    });
    await this.refreshUser(tokenStore);
  }

  async getOauthUrl(
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
      throw new Error("Admin session token is currently not supported for Oauth");
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

  async callOauthCallback(
    oauthParams: URLSearchParams, 
    redirectUri: string,
    codeVerifier: string, 
    state: string,
    tokenStore: TokenStore,
  ) {
    if (!('publishableClientKey' in this.options)) {
      // TODO fix
      throw new Error("Admin session token is currently not supported for Oauth");
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
      console.error('Error validating OAuth response', params);
      throw new Error("Error validating OAuth response"); // Handle OAuth 2.0 redirect error
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
      for (const challenge of challenges) {
        console.error('WWW-Authenticate Challenge', challenge);
      }
      throw new Error(); // Handle WWW-Authenticate Challenges as needed
    }

    const result = await oauth.processAuthorizationCodeOAuth2Response(as, client, response);
    if (oauth.isOAuth2Error(result)) {
      console.error('Error Response', result);
      throw new Error(); // Handle OAuth 2.0 response body error
    }
    tokenStore.update(old => ({
      accessToken: result.access_token ?? null,
      refreshToken: result.refresh_token ?? old?.refreshToken ?? null,
    }));
    await this.refreshUser(tokenStore);
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
    await this.refreshUser(tokenStore);
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

  async getClientProject(): Promise<Result<ClientProjectJson>> {
    const response = await this.sendClientRequest("/projects/" + this.options.projectId, {}, null);
    const project: ClientProjectJson | null = await response.json();
    if (!project) return Result.error(new Error("Failed to get project"));
    return Result.ok(project);
  }

  async setClientUserCustomizableData(update: Partial<UserCustomizableJson>, tokenStore: TokenStore) {
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
    await this.refreshUser(tokenStore);
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

export function getProductionModeErrors(project: ProjectJson): { errorMessage: string, fixUrlRelative: string }[] {
  const errors: { errorMessage: string, fixUrlRelative: string }[] = [];

  for (const { domain, handlerPath } of project.evaluatedConfig.domains) {
    // TODO: check if handlerPath is valid
    const fixUrlRelative = `/projects/${encodeURIComponent(project.id)}/auth/urls-and-callbacks`;

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
        errorMessage: "Auth callback prefix should be HTTPS: " + domain,
        fixUrlRelative,
      });
    }
  }

  return errors;
}

