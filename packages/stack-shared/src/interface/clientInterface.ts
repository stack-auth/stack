import * as oauth from 'oauth4webapi';

import { cookies } from '@stackframe/stack-sc';
import { KnownError, KnownErrors } from '../known-errors';
import { AccessToken, InternalSession, RefreshToken } from '../sessions';
import { generateSecureRandomString } from '../utils/crypto';
import { StackAssertionError, throwErr } from '../utils/errors';
import { globalVar } from '../utils/globals';
import { ReadonlyJson } from '../utils/json';
import { filterUndefined } from '../utils/objects';
import { Result } from "../utils/results";
import { deindent } from '../utils/strings';
import { CurrentUserCrud } from './crud/current-user';
import { ConnectedAccountAccessTokenCrud } from './crud/oauth';
import { InternalProjectsCrud, ProjectsCrud } from './crud/projects';
import { TeamMemberProfilesCrud } from './crud/team-member-profiles';
import { TeamPermissionsCrud } from './crud/team-permissions';
import { TeamsCrud } from './crud/teams';

export type ClientInterfaceOptions = {
  clientVersion: string,
  baseUrl: string,
  projectId: string,
} & ({
  publishableClientKey: string,
} | {
  projectOwnerSession: InternalSession,
});

export class StackClientInterface {
  constructor(public readonly options: ClientInterfaceOptions) {
    // nothing here
  }

  get projectId() {
    return this.options.projectId;
  }

  getApiUrl() {
    return this.options.baseUrl + "/api/v1";
  }

  public async runNetworkDiagnostics(session?: InternalSession | null, requestType?: "client" | "server" | "admin") {
    const tryRequest = async (cb: () => Promise<void>) => {
      try {
        await cb();
        return "OK";
      } catch (e) {
        return `${e}`;
      }
    };
    const cfTrace = await tryRequest(async () => {
      const res = await fetch("https://1.1.1.1/cdn-cgi/trace");
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
      }
    });
    const apiRoot = session !== undefined && requestType !== undefined ? await tryRequest(async () => {
      const res = await this.sendClientRequestInner("/", {}, session!, requestType);
      if (res.status === "error") {
        throw res.error;
      }
    }) : "Not tested";
    const baseUrlBackend = await tryRequest(async () => {
      const res = await fetch(new URL("/health", this.getApiUrl()));
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
      }
    });
    const prodDashboard = await tryRequest(async () => {
      const res = await fetch("https://app.stack-auth.com/health");
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
      }
    });
    const prodBackend = await tryRequest(async () => {
      const res = await fetch("https://api.stack-auth.com/health");
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
      }
    });
    return {
      "navigator?.onLine": globalVar.navigator?.onLine,
      cfTrace,
      apiRoot,
      baseUrlBackend,
      prodDashboard,
      prodBackend,
    };
  }

  protected async _networkRetry<T>(cb: () => Promise<Result<T, any>>, session?: InternalSession | null, requestType?: "client" | "server" | "admin"): Promise<T> {
    const retriedResult = await Result.retry(
      cb,
      5,
      { exponentialDelayBase: 1000 },
    );

    // try to diagnose the error for the user
    if (retriedResult.status === "error") {
      if (globalVar.navigator && !globalVar.navigator.onLine) {
        throw new Error("Failed to send Stack network request. It seems like you are offline. (window.navigator.onLine is falsy)", { cause: retriedResult.error });
      }
      throw new Error(deindent`
        Stack is unable to connect to the server. Please check your internet connection and try again.

        If the problem persists, please contact Stack support and provide a screenshot of your entire browser console.

        ${retriedResult.error}

        ${JSON.stringify(await this.runNetworkDiagnostics(session, requestType), null, 2)}
      `, { cause: retriedResult.error });
    }
    return retriedResult.data;
  }

  protected async _networkRetryException<T>(cb: () => Promise<T>, session?: InternalSession | null, requestType?: "client" | "server" | "admin"): Promise<T> {
    return await this._networkRetry(async () => await Result.fromThrowingAsync(cb), session, requestType);
  }

  public async fetchNewAccessToken(refreshToken: RefreshToken) {
    if (!('publishableClientKey' in this.options)) {
      // TODO support it
      throw new Error("Admin session token is currently not supported for fetching new access token. Did you try to log in on a StackApp initiated with the admin session?");
    }

    const as = {
      issuer: this.options.baseUrl,
      algorithm: 'oauth2',
      token_endpoint: this.getApiUrl() + '/auth/oauth/token',
    };
    const client: oauth.Client = {
      client_id: this.projectId,
      client_secret: this.options.publishableClientKey,
      token_endpoint_auth_method: 'client_secret_post',
    };

    const rawResponse = await this._networkRetryException(
      async () => await oauth.refreshTokenGrantRequest(
        as,
        client,
        refreshToken.token,
      )
    );
    const response = await this._processResponse(rawResponse);

    if (response.status === "error") {
      const error = response.error;
      if (error instanceof KnownErrors.RefreshTokenError) {
        return null;
      }
      throw error;
    }

    if (!response.data.ok) {
      const body = await response.data.text();
      throw new Error(`Failed to send refresh token request: ${response.status} ${body}`);
    }

    const result = await oauth.processRefreshTokenResponse(as, client, response.data);
    if (oauth.isOAuth2Error(result)) {
      // TODO Handle OAuth 2.0 response body error
      throw new StackAssertionError("OAuth error", { result });
    }

    if (!result.access_token) {
      throw new StackAssertionError("Access token not found in token endpoint response, this is weird!");
    }

    return new AccessToken(result.access_token);
  }

  protected async sendClientRequest(
    path: string,
    requestOptions: RequestInit,
    session: InternalSession | null,
    requestType: "client" | "server" | "admin" = "client",
  ) {
    session ??= this.createSession({
      refreshToken: null,
    });


    return await this._networkRetry(
      () => this.sendClientRequestInner(path, requestOptions, session!, requestType),
      session,
      requestType,
    );
  }

  public createSession(options: Omit<ConstructorParameters<typeof InternalSession>[0], "refreshAccessTokenCallback">): InternalSession {
    const session = new InternalSession({
      refreshAccessTokenCallback: async (refreshToken) => await this.fetchNewAccessToken(refreshToken),
      ...options,
    });
    return session;
  }

  protected async sendClientRequestAndCatchKnownError<E extends typeof KnownErrors[keyof KnownErrors]>(
    path: string,
    requestOptions: RequestInit,
    tokenStoreOrNull: InternalSession | null,
    errorsToCatch: readonly E[],
  ): Promise<Result<
    Response & {
      usedTokens: {
        accessToken: AccessToken,
        refreshToken: RefreshToken | null,
      } | null,
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
    session: InternalSession,
    requestType: "client" | "server" | "admin",
  ): Promise<Result<Response & {
    usedTokens: {
      accessToken: AccessToken,
      refreshToken: RefreshToken | null,
    } | null,
  }>> {
    /**
     * `tokenObj === null` means the session is invalid/not logged in
     */
    const tokenObj = await session.getPotentiallyExpiredTokens();

    const adminSession = "projectOwnerSession" in this.options ? this.options.projectOwnerSession : null;
    const adminTokenObj = adminSession ? await adminSession.getPotentiallyExpiredTokens() : null;

    // all requests should be dynamic to prevent Next.js caching
    cookies?.();

    const url = this.getApiUrl() + path;
    const params: RequestInit = {
      /**
       * This fetch may be cross-origin, in which case we don't want to send cookies of the
       * original origin (this is the default behavior of `credentials`).
       *
       * To help debugging, also omit cookies on same-origin, so we don't accidentally
       * implement reliance on cookies anywhere.
       *
       * However, Cloudflare Workers don't actually support `credentials`, so we only set it
       * if Cloudflare-exclusive globals are not detected. https://github.com/cloudflare/workers-sdk/issues/2514
       */
      ...("WebSocketPair" in globalVar ? {} : {
        credentials: "omit",
      }),
      ...options,
      headers: {
        "X-Stack-Override-Error-Status": "true",
        "X-Stack-Project-Id": this.projectId,
        "X-Stack-Access-Type": requestType,
        "X-Stack-Client-Version": this.options.clientVersion,
        ...(tokenObj ? {
          "X-Stack-Access-Token": tokenObj.accessToken.token,
        } : {}),
        ...(tokenObj?.refreshToken ? {
          "X-Stack-Refresh-Token": tokenObj.refreshToken.token,
        } : {}),
        ...('publishableClientKey' in this.options ? {
          "X-Stack-Publishable-Client-Key": this.options.publishableClientKey,
        } : {}),
        ...(adminTokenObj ? {
          "X-Stack-Admin-Access-Token": adminTokenObj.accessToken.token,
        } : {}),
        /**
         * Next.js until v15 would cache fetch requests by default, and forcefully disabling it was nearly impossible.
         *
         * This header is used to change the cache key and hence always disable it, because we do our own caching.
         *
         * When we drop support for Next.js <15, we may be able to remove this header, but please make sure that this is
         * the case (I haven't actually tested.)
         */
        "X-Stack-Random-Nonce": generateSecureRandomString(),
        ...options.headers,
      },
      /**
       * Cloudflare Workers does not support cache, so don't pass it there
       */
      ...("WebSocketPair" in globalVar ? {} : {
        cache: "no-store",
      }),
    };

    let rawRes;
    try {
      rawRes = await fetch(url, params);
    } catch (e) {
      if (e instanceof TypeError) {
        // Network error, retry
        return Result.error(e);
      }
      throw e;
    }

    const processedRes = await this._processResponse(rawRes);
    if (processedRes.status === "error") {
      // If the access token is invalid, reset it and retry
      if (processedRes.error instanceof KnownErrors.InvalidAccessToken) {
        if (!tokenObj) {
          throw new StackAssertionError("Received invalid access token, but session is not logged in", { tokenObj, processedRes });
        }
        session.markAccessTokenExpired(tokenObj.accessToken);
        return Result.error(processedRes.error);
      }

      // Same for the admin access token
      // TODO HACK: Some of the backend hasn't been ported to use the new error codes, so if we have project owner tokens we need to check for ApiKeyNotFound too. Once the migration to smartRouteHandlers is complete, we can check for InvalidAdminAccessToken only.
      if (adminSession && (processedRes.error instanceof KnownErrors.InvalidAdminAccessToken || processedRes.error instanceof KnownErrors.ApiKeyNotFound)) {
        if (!adminTokenObj) {
          throw new StackAssertionError("Received invalid admin access token, but admin session is not logged in", { adminTokenObj, processedRes });
        }
        adminSession.markAccessTokenExpired(adminTokenObj.accessToken);
        return Result.error(processedRes.error);
      }

      // Known errors are client side errors, so except for the ones above they should not be retried
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
      throw new StackAssertionError(`Failed to send request to ${url}: ${res.status} ${error}`, { request: params, res });
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
        throw new StackAssertionError("Mismatch between x-stack-known-error header and error code in body; the server's response is invalid");
      }
      const error = KnownError.fromJson(errorJson);
      return Result.error(error);
    }

    return Result.ok(res);
  }

  public async checkFeatureSupport(options: { featureName?: string } & ReadonlyJson): Promise<never> {
    const res = await this.sendClientRequest("/check-feature-support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    }, null);

    throw new StackAssertionError(await res.text());
  }

  async sendForgotPasswordEmail(
    email: string,
    callbackUrl: string,
  ): Promise<KnownErrors["UserNotFound"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/password/send-reset-code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          callback_url: callbackUrl,
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
    email: string,
    callbackUrl: string,
    session: InternalSession
  ): Promise<KnownErrors["EmailAlreadyVerified"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/contact-channels/send-verification-code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          callback_url: callbackUrl,
        }),
      },
      session,
      [KnownErrors.EmailAlreadyVerified]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async sendMagicLinkEmail(
    email: string,
    callbackUrl: string,
  ): Promise<KnownErrors["RedirectUrlNotWhitelisted"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/otp/send-sign-in-code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          callback_url: callbackUrl,
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
    options: { code: string } & ({ password: string } | { onlyVerifyCode: true })
  ): Promise<KnownErrors["VerificationCodeError"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "onlyVerifyCode" in options ? "/auth/password/reset/check-code" : "/auth/password/reset",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: options.code,
          ...("password" in options ? { password: options.password } : {}),
        }),
      },
      null,
      [KnownErrors.VerificationCodeError]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async updatePassword(
    options: { oldPassword: string, newPassword: string },
    session: InternalSession
  ): Promise<KnownErrors["PasswordConfirmationMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/password/update",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          old_password: options.oldPassword,
          new_password: options.newPassword,
        }),
      },
      session,
      [KnownErrors.PasswordConfirmationMismatch, KnownErrors.PasswordRequirementsNotMet]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async verifyPasswordResetCode(code: string): Promise<KnownErrors["VerificationCodeError"] | undefined> {
    const res = await this.resetPassword({ code, onlyVerifyCode: true });
    if (res && !(res instanceof KnownErrors.VerificationCodeError)) {
      throw res;
    }
    return res;
  }

  async verifyEmail(code: string): Promise<KnownErrors["VerificationCodeError"] | undefined> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/contact-channels/verify",
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
      [KnownErrors.VerificationCodeError]
    );

    if (res.status === "error") {
      return res.error;
    }
  }

  async sendTeamInvitation(options: {
    email: string,
    teamId: string,
    callbackUrl: string,
    session: InternalSession | null,
  }): Promise<Result<undefined, KnownErrors["TeamPermissionRequired"]>> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/team-invitations/send-code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: options.email,
          team_id: options.teamId,
          callback_url: options.callbackUrl,
        }),
      },
      options.session,
      [KnownErrors.TeamPermissionRequired]
    );

    if (res.status === "error") {
      return Result.error(res.error);
    } else {
      return Result.ok(undefined);
    }
  }

  async acceptTeamInvitation<T extends 'use' | 'details' | 'check'>(options: {
    code: string,
    session: InternalSession,
    type: T,
  }): Promise<Result<T extends 'details' ? { team_display_name: string } : undefined, KnownErrors["VerificationCodeError"]>> {
    const res = await this.sendClientRequestAndCatchKnownError(
      options.type === 'check' ?
        "/team-invitations/accept/check-code" :
        options.type === 'details' ?
          "/team-invitations/accept/details" :
          "/team-invitations/accept",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: options.code,
        }),
      },
      options.session,
      [KnownErrors.VerificationCodeError]
    );

    if (res.status === "error") {
      return Result.error(res.error);
    } else {
      return Result.ok(await res.data.json());
    }
  }

  async totpMfa(
    attemptCode: string,
    totp: string,
    session: InternalSession
  ) {
    const res = await this.sendClientRequest("/auth/mfa/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: attemptCode,
        type: "totp",
        totp: totp,
      }),
    }, session);

    const result = await res.json();
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      newUser: result.is_new_user,
    };
  }

  async signInWithCredential(
    email: string,
    password: string,
    session: InternalSession
  ): Promise<KnownErrors["EmailPasswordMismatch"] | { accessToken: string, refreshToken: string }> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/password/sign-in",
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
      session,
      [KnownErrors.EmailPasswordMismatch]
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }

  async signUpWithCredential(
    email: string,
    password: string,
    emailVerificationRedirectUrl: string,
    session: InternalSession,
  ): Promise<KnownErrors["UserEmailAlreadyExists"] | KnownErrors["PasswordRequirementsNotMet"] | { accessToken: string, refreshToken: string }> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/password/sign-up",
      {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          verification_callback_url: emailVerificationRedirectUrl,
        }),
      },
      session,
      [KnownErrors.UserEmailAlreadyExists, KnownErrors.PasswordRequirementsNotMet]
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }

  async signInWithMagicLink(code: string): Promise<KnownErrors["VerificationCodeError"] | { newUser: boolean, accessToken: string, refreshToken: string }> {
    const res = await this.sendClientRequestAndCatchKnownError(
      "/auth/otp/sign-in",
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
      [KnownErrors.VerificationCodeError]
    );

    if (res.status === "error") {
      return res.error;
    }

    const result = await res.data.json();
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      newUser: result.is_new_user,
    };
  }

  async getOAuthUrl(
    options: {
      provider: string,
      redirectUrl: string,
      errorRedirectUrl: string,
      afterCallbackRedirectUrl?: string,
      codeChallenge: string,
      state: string,
      type: "authenticate" | "link",
      providerScope?: string,
    } & ({ type: "authenticate" } | { type: "link", session: InternalSession })
  ): Promise<string> {
    const updatedRedirectUrl = new URL(options.redirectUrl);
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
    const url = new URL(this.getApiUrl() + "/auth/oauth/authorize/" + options.provider.toLowerCase());
    url.searchParams.set("client_id", this.projectId);
    url.searchParams.set("client_secret", this.options.publishableClientKey);
    url.searchParams.set("redirect_uri", updatedRedirectUrl.toString());
    url.searchParams.set("scope", "legacy");
    url.searchParams.set("state", options.state);
    url.searchParams.set("grant_type", "authorization_code");
    url.searchParams.set("code_challenge", options.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("type", options.type);
    url.searchParams.set("error_redirect_url", options.errorRedirectUrl);

    if (options.afterCallbackRedirectUrl) {
      url.searchParams.set("after_callback_redirect_url", options.afterCallbackRedirectUrl);
    }

    if (options.type === "link") {
      const tokens = await options.session.getPotentiallyExpiredTokens();
      url.searchParams.set("token", tokens?.accessToken.token || "");

      if (options.providerScope) {
        url.searchParams.set("provider_scope", options.providerScope);
      }
    }

    return url.toString();
  }

  async callOAuthCallback(options: {
    oauthParams: URLSearchParams,
    redirectUri: string,
    codeVerifier: string,
    state: string,
  }): Promise<{ newUser: boolean, afterCallbackRedirectUrl?: string, accessToken: string, refreshToken: string }> {
    if (!('publishableClientKey' in this.options)) {
      // TODO fix
      throw new Error("Admin session token is currently not supported for OAuth");
    }
    const as = {
      issuer: this.options.baseUrl,
      algorithm: 'oauth2',
      token_endpoint: this.getApiUrl() + '/auth/oauth/token',
    };
    const client: oauth.Client = {
      client_id: this.projectId,
      client_secret: this.options.publishableClientKey,
      token_endpoint_auth_method: 'client_secret_post',
    };
    const params = await this._networkRetryException(
      async () => oauth.validateAuthResponse(as, client, options.oauthParams, options.state),
    );
    if (oauth.isOAuth2Error(params)) {
      throw new StackAssertionError("Error validating outer OAuth response", { params }); // Handle OAuth 2.0 redirect error
    }
    const response = await oauth.authorizationCodeGrantRequest(
      as,
      client,
      params,
      options.redirectUri,
      options.codeVerifier,
    );

    const result = await oauth.processAuthorizationCodeOAuth2Response(as, client, response);
    if (oauth.isOAuth2Error(result)) {
      if ("code" in result && result.code === "MULTI_FACTOR_AUTHENTICATION_REQUIRED") {
        throw new KnownErrors.MultiFactorAuthenticationRequired((result as any).details.attempt_code);
      }
      // TODO Handle OAuth 2.0 response body error
      throw new StackAssertionError("Outer OAuth error during authorization code response", { result });
    }
    return {
      newUser: result.is_new_user as boolean,
      afterCallbackRedirectUrl: result.after_callback_redirect_url as string | undefined,
      accessToken: result.access_token,
      refreshToken: result.refresh_token ?? throwErr("Refresh token not found in outer OAuth response"),
    };
  }

  async signOut(session: InternalSession): Promise<void> {
    const tokenObj = await session.getPotentiallyExpiredTokens();
    if (tokenObj) {
      const resOrError = await this.sendClientRequestAndCatchKnownError(
        "/auth/sessions/current",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({}),
        },
        session,
        [KnownErrors.RefreshTokenError]
      );
      if (resOrError.status === "error") {
        if (resOrError.error instanceof KnownErrors.RefreshTokenError) {
          // refresh token was already invalid, just continue like nothing happened
        } else {
          // this should never happen
          throw new StackAssertionError("Unexpected error", { error: resOrError.error });
        }
      } else {
        // user was signed out successfully, all good
      }
    }
    session.markInvalid();
  }

  async getClientUserByToken(session: InternalSession): Promise<CurrentUserCrud["Client"]["Read"] | null> {
    const responseOrError = await this.sendClientRequestAndCatchKnownError(
      "/users/me",
      {},
      session,
      [KnownErrors.CannotGetOwnUserWithoutUser],
    );
    if (responseOrError.status === "error") {
      if (responseOrError.error instanceof KnownErrors.CannotGetOwnUserWithoutUser) {
        return null;
      } else {
        throw new StackAssertionError("Unexpected uncaught error", { cause: responseOrError.error });
      }
    }
    const response = responseOrError.data;
    const user: CurrentUserCrud["Client"]["Read"] = await response.json();
    if (!(user as any)) throw new StackAssertionError("User endpoint returned null; this should never happen");
    return user;
  }

  async listTeamMemberProfiles(
    options: {
      teamId?: string,
      userId?: string,
    },
    session: InternalSession,
  ): Promise<TeamMemberProfilesCrud['Client']['Read'][]> {
    const response = await this.sendClientRequest(
      "/team-member-profiles?" + new URLSearchParams(filterUndefined({
        team_id: options.teamId,
        user_id: options.userId,
      })),
      {},
      session,
    );
    const result = await response.json() as TeamMemberProfilesCrud['Client']['List'];
    return result.items;
  }

  async getTeamMemberProfile(
    options: {
      teamId: string,
      userId: string,
    },
    session: InternalSession,
  ): Promise<TeamMemberProfilesCrud['Client']['Read']> {
    const response = await this.sendClientRequest(
      `/team-member-profiles/${options.teamId}/${options.userId}`,
      {},
      session,
    );
    return await response.json();
  }

  async leaveTeam(
    teamId: string,
    session: InternalSession,
  ) {
    await this.sendClientRequest(
      `/team-memberships/${teamId}/me`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      session,
    );
  }

  async updateTeamMemberProfile(
    options: {
      teamId: string,
      userId: string,
      profile: TeamMemberProfilesCrud['Client']['Update'],
    },
    session: InternalSession,
  ) {
    await this.sendClientRequest(
      `/team-member-profiles/${options.teamId}/${options.userId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(options.profile),
      },
      session,
    );
  }

  async updateTeam(
    options: {
      teamId: string,
      data: TeamsCrud['Client']['Update'],
    },
    session: InternalSession,
  ) {
    await this.sendClientRequest(
      `/teams/${options.teamId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(options.data),
      },
      session,
    );
  }

  async listCurrentUserTeamPermissions(
    options: {
      teamId: string,
      recursive: boolean,
    },
    session: InternalSession
  ): Promise<TeamPermissionsCrud['Client']['Read'][]> {
    const response = await this.sendClientRequest(
      `/team-permissions?team_id=${options.teamId}&user_id=me&recursive=${options.recursive}`,
      {},
      session,
    );
    const result = await response.json() as TeamPermissionsCrud['Client']['List'];
    return result.items;
  }

  async listCurrentUserTeams(session: InternalSession): Promise<TeamsCrud["Client"]["Read"][]> {
    const response = await this.sendClientRequest(
      "/teams?user_id=me",
      {},
      session,
    );
    const result = await response.json() as TeamsCrud["Client"]["List"];
    return result.items;
  }

  async getClientProject(): Promise<Result<ProjectsCrud['Client']['Read'], KnownErrors["ProjectNotFound"]>> {
    const responseOrError = await this.sendClientRequestAndCatchKnownError("/projects/current", {}, null, [KnownErrors.ProjectNotFound]);
    if (responseOrError.status === "error") {
      return Result.error(responseOrError.error);
    }
    const response = responseOrError.data;
    const project: ProjectsCrud['Client']['Read'] = await response.json();
    return Result.ok(project);
  }

  async updateClientUser(update: CurrentUserCrud["Client"]["Update"], session: InternalSession) {
    await this.sendClientRequest(
      "/users/me",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(update),
      },
      session,
    );
  }

  async listProjects(session: InternalSession): Promise<InternalProjectsCrud['Client']['Read'][]> {
    const response = await this.sendClientRequest("/internal/projects", {}, session);
    if (!response.ok) {
      throw new Error("Failed to list projects: " + response.status + " " + (await response.text()));
    }

    const json = await response.json() as InternalProjectsCrud['Client']['List'];
    return json.items;
  }

  async createProject(
    project: InternalProjectsCrud['Client']['Create'],
    session: InternalSession,
  ): Promise<InternalProjectsCrud['Client']['Read']> {
    const fetchResponse = await this.sendClientRequest(
      "/internal/projects",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(project),
      },
      session,
    );
    if (!fetchResponse.ok) {
      throw new Error("Failed to create project: " + fetchResponse.status + " " + (await fetchResponse.text()));
    }

    const json = await fetchResponse.json();
    return json;
  }

  async createProviderAccessToken(
    provider: string,
    scope: string,
    session: InternalSession,
  ): Promise<ConnectedAccountAccessTokenCrud['Client']['Read']> {
    const response = await this.sendClientRequest(
      `/connected-accounts/me/${provider}/access-token`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ scope }),
      },
      session,
    );
    return await response.json();
  }

  async createTeamForCurrentUser(
    data: TeamsCrud['Client']['Create'],
    session: InternalSession,
  ): Promise<TeamsCrud['Client']['Read']> {
    const response = await this.sendClientRequest(
      "/teams?add_current_user=true",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      session,
    );
    return await response.json();
  }
}
