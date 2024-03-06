import * as oauth from 'oauth4webapi';
import crypto from "crypto";

import { 
  AccessTokenExpiredErrorCode, 
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
import { AsyncResult, Result } from "../utils/results";
import { ReadonlyJson, parseJson } from '../utils/json';
import { AsyncCache } from '../utils/caches';
import { typedAssign } from '../utils/objects';
import { AsyncStore, ReadonlyAsyncStore } from '../utils/stores';
import { neverResolve, runAsynchronously } from '../utils/promises';

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
  readonly credentialEnabled: boolean,
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
    oauthProviders: OauthProviderConfigJson[],
    emailConfig?: EmailConfigJson,
    domains: DomainConfigJson[],
  },
};

export type OauthProviderConfigJson = {
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

  protected async sendClientRequest(
    path: string, 
    requestOptions: RequestInit, 
    tokenStoreOrNull: TokenStore | null
  ) {
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

  protected async sendClientRequestAndCatchKnownError<E>(
    path: string, 
    requestOptions: RequestInit, 
    tokenStoreOrNull: TokenStore | null,
    errorCodes: string[],
  ) {
    try {
      return Result.ok(await this.sendClientRequest(path, requestOptions, tokenStoreOrNull));
    } catch (e) {
      if (e instanceof KnownError && errorCodes.includes(e.errorCode)) {
        return Result.error(e.errorCode as E);
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
        ...'projectOwnerTokens' in this.options ? {
          "x-stack-admin-access-token": AsyncResult.or(this.options.projectOwnerTokens?.get(), null)?.accessToken ?? "",
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
    const res = await this.sendClientRequestAndCatchKnownError<PasswordResetLinkErrorCode>(
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
      PasswordResetLinkErrorCodes
    );


    if (res.status === "error") {
      return res.error;
    }
  }

  async resetPassword(options: { password: string, code: string }): Promise<PasswordResetLinkErrorCode | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError<PasswordResetLinkErrorCode>(
      "/auth/password-reset",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(options),
      },
      null,
      PasswordResetLinkErrorCodes
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async verifyPasswordResetCode(code: string): Promise<PasswordResetLinkErrorCode | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError<PasswordResetLinkErrorCode>(
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
      PasswordResetLinkErrorCodes
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async verifyEmail(code: string): Promise<EmailVerificationLinkErrorCode | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError<EmailVerificationLinkErrorCode>(
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
      EmailVerificationLinkErrorCodes
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async signInWithCredential(
    email: string, 
    password: string, 
    tokenStore: TokenStore
  ): Promise<SignInErrorCode | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError<SignInErrorCode>(
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
      SignInErrorCodes
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    tokenStore.set({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    });
  }

  async signUpWithCredential(
    email: string,
    password: string,
    emailVerificationRedirectUrl: string,
    tokenStore: TokenStore,
  ): Promise<SignUpErrorCode | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError<SignUpErrorCode>(
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
      SignUpErrorCodes
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    tokenStore.set({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    });
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

