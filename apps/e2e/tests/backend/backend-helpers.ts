import { InternalProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { encodeBase64 } from "@stackframe/stack-shared/dist/utils/bytes";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import * as jose from "jose";
import { expect } from "vitest";
import { Context, Mailbox, NiceRequestInit, NiceResponse, STACK_BACKEND_BASE_URL, STACK_INTERNAL_PROJECT_ADMIN_KEY, STACK_INTERNAL_PROJECT_CLIENT_KEY, STACK_INTERNAL_PROJECT_ID, STACK_INTERNAL_PROJECT_SERVER_KEY, createMailbox, localRedirectUrl, niceFetch, updateCookiesFromResponse } from "../helpers";

type BackendContext = {
  readonly projectKeys: ProjectKeys,
  readonly mailbox: Mailbox,
  readonly userAuth: {
    readonly refreshToken?: string,
    readonly accessToken?: string,
  } | null,
};

export const backendContext = new Context<BackendContext, Partial<BackendContext>>(
  () => ({
    projectKeys: InternalProjectKeys,
    mailbox: createMailbox(),
    userAuth: null,
  }),
  (acc, update) => {
    return {
      ...acc,
      ...filterUndefined(update),
    };
  },
);

const jwks = jose.createRemoteJWKSet(new URL("/.well-known/jwks.json", STACK_BACKEND_BASE_URL));

export type ProjectKeys = "no-project" | {
  projectId: string,
  publishableClientKey?: string,
  secretServerKey?: string,
  superSecretAdminKey?: string,
  adminAccessToken?: string,
};

export const InternalProjectKeys = {
  projectId: STACK_INTERNAL_PROJECT_ID,
  publishableClientKey: STACK_INTERNAL_PROJECT_CLIENT_KEY,
  secretServerKey: STACK_INTERNAL_PROJECT_SERVER_KEY,
  superSecretAdminKey: STACK_INTERNAL_PROJECT_ADMIN_KEY,
};

export const InternalProjectClientKeys = {
  projectId: STACK_INTERNAL_PROJECT_ID,
  publishableClientKey: STACK_INTERNAL_PROJECT_CLIENT_KEY,
};

function expectSnakeCase(obj: unknown, path: string): void {
  if (typeof obj !== "object" || obj === null) return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      expectSnakeCase(obj[i], `${path}[${i}]`);
    }
  } else {
    for (const [key, value] of Object.entries(obj)) {
      if (key.match(/[a-z0-9][A-Z][a-z0-9]+/) && !key.includes("_") && !["newUser", "afterCallbackRedirectUrl"].includes(key)) {
        throw new StackAssertionError(`Object has camelCase key (expected snake case): ${path}.${key}`);
      }
      if (key === "client_metadata" || key === "server_metadata") continue;
      expectSnakeCase(value, `${path}.${key}`);
    }
  }
}

export async function niceBackendFetch(url: string | URL, options?: Omit<NiceRequestInit, "body" | "headers"> & {
  accessType?: null | "client" | "server" | "admin",
  body?: unknown,
  headers?: Record<string, string | undefined>,
}): Promise<NiceResponse> {
  const { body, headers, accessType, ...otherOptions } = options ?? {};
  if (typeof body === "object") {
    expectSnakeCase(body, "req.body");
  }
  const { projectKeys, userAuth } = backendContext.value;
  const fullUrl = new URL(url, STACK_BACKEND_BASE_URL);
  if (fullUrl.origin !== new URL(STACK_BACKEND_BASE_URL).origin) throw new StackAssertionError(`Invalid niceBackendFetch origin: ${fullUrl.origin}`);
  if (fullUrl.protocol !== new URL(STACK_BACKEND_BASE_URL).protocol) throw new StackAssertionError(`Invalid niceBackendFetch protocol: ${fullUrl.protocol}`);
  const res = await niceFetch(fullUrl, {
    ...otherOptions,
    ...body !== undefined ? { body: JSON.stringify(body) } : {},
    headers: filterUndefined({
      "content-type": body !== undefined ? "application/json" : undefined,
      "x-stack-access-type": accessType ?? undefined,
      ...projectKeys !== "no-project" && accessType ? {
        "x-stack-project-id": projectKeys.projectId,
        "x-stack-publishable-client-key": projectKeys.publishableClientKey,
        "x-stack-secret-server-key": projectKeys.secretServerKey,
        "x-stack-super-secret-admin-key": projectKeys.superSecretAdminKey,
        'x-stack-admin-access-token': projectKeys.adminAccessToken,
      } : {},
      "x-stack-access-token": userAuth?.accessToken,
      "x-stack-refresh-token": userAuth?.refreshToken,
      "x-stack-disable-artificial-development-delay": "yes",
      ...Object.fromEntries(new Headers(filterUndefined(headers ?? {}) as any).entries()),
    }),
  });
  if (res.status >= 500 && res.status < 600) {
    throw new StackAssertionError(`Unexpected internal server error: ${res.status} ${res.body}`);
  }
  if (res.headers.has("x-stack-known-error")) {
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.body).toMatchObject({
      code: res.headers.get("x-stack-known-error"),
    });
  }
  if (typeof res.body === "object" && res.body) {
    expectSnakeCase(res.body, "res.body");
  }
  return res;
}


export namespace Auth {
  export async function ensureParsableAccessToken() {
    const accessToken = backendContext.value.userAuth?.accessToken;
    if (accessToken) {
      const { payload } = await jose.jwtVerify(accessToken, jwks);
      expect(payload).toEqual({
        "exp": expect.any(Number),
        "iat": expect.any(Number),
        "iss": "https://access-token.jwt-signature.stack-auth.com",
        "projectId": expect.any(String),
        "sub": expect.any(String),
      });
    }
  }

  /**
   * Valid session & valid access token: OK
   * Valid session & invalid access token: OK
   * Invalid session & valid access token: Error
   * Invalid session & invalid access token: Error
   */
  export async function expectSessionToBeValid() {
    const response = await niceBackendFetch("/api/v1/auth/sessions/current/refresh", { method: "POST", accessType: "client" });
    if (response.status !== 200) {
      throw new StackAssertionError("Expected session to be valid, but was actually invalid.", { response });
    }
    expect(response).toEqual({
      status: 200,
      headers: expect.objectContaining({}),
      body: expect.objectContaining({}),
    });
  }

  /**
   * Valid session & valid access token: Error
   * Valid session & invalid access token: Error
   * Invalid session & valid access token: OK
   * Invalid session & invalid access token: OK
   */
  export async function expectSessionToBeInvalid() {
    const response = await niceBackendFetch("/api/v1/auth/sessions/current/refresh", { method: "POST", accessType: "client" });
    expect(response.status).not.toEqual(200);
  }

  /**
   * Valid session & valid access token: OK
   * Valid session & invalid access token: Error
   * Invalid session & valid access token: OK
   * Invalid session & invalid access token: Error
   */
  export async function expectAccessTokenToBeInvalid() {
    await ensureParsableAccessToken();
    const response = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
    if (response.status === 200) {
      throw new StackAssertionError("Expected access token to be invalid, but was actually valid.", { response });
    }
  }

  /**
   * Valid session & valid access token: OK
   * Valid session & invalid access token: Error
   * Invalid session & valid access token: OK
   * Invalid session & invalid access token: Error
   */
  export async function expectAccessTokenToBeValid() {
    await ensureParsableAccessToken();
    const response = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
    if (response.status !== 200) {
      throw new StackAssertionError("Expected access token to be valid, but was actually invalid.", { response });
    }
  }

  /**
   * Valid session & valid access token: OK
   * Valid session & invalid access token: Error
   * Invalid session & valid access token: Error
   * Invalid session & invalid access token: Error
   *
   * (see comment in the function for rationale, and why "invalid refresh token but valid access token" is not
   * considered "signed in")
   */
  export async function expectToBeSignedIn() {
    // there is a world where we would accept either access token OR session to be "signed in", instead of both
    // however, it's better to be strict and throw an error if either is invalid; this helps catch bugs
    // if you really want to check only one of them, use expectSessionToBeValid or expectAccessTokenToBeValid
    // for more information, see the comment in expectToBeSignedOut
    await Auth.expectAccessTokenToBeValid();
    await Auth.expectSessionToBeValid();
  }

  /**
   * Valid session & valid access token: Error
   * Valid session & invalid access token: Error
   * Invalid session & valid access token: Error
   * Invalid session & invalid access token: OK
   */
  export async function expectToBeSignedOut() {
    await Auth.expectAccessTokenToBeInvalid();

    // usually, when we mean "signed out" we mean "both access token AND session are invalid"; we'd rather be strict
    // so, we additionally check the session
    // this has the weird side effect that expectToBeSignedIn (which is also strict, checking that access token AND
    // session are valid) may throw, even if expectToBeSignedOut also throws
    // if you run into something like that in your tests, use expectSessionToBeInvalid instead
    await Auth.expectSessionToBeInvalid();
  }

  export async function signOut() {
    const response = await niceBackendFetch("/api/v1/auth/sessions/current", {
      method: "DELETE",
      accessType: "client",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": { "success": true },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    if (backendContext.value.userAuth) backendContext.set({ userAuth: { ...backendContext.value.userAuth, accessToken: undefined } });
    await Auth.expectToBeSignedOut();
    return {
      signOutResponse: response,
    };
  }

  export namespace Otp {
    export async function sendSignInCode() {
      const mailbox = backendContext.value.mailbox;
      const response = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
        method: "POST",
        accessType: "client",
        body: {
          email: mailbox.emailAddress,
          callback_url: "http://localhost:12345/some-callback-url",
        },
      });
      expect(response).toMatchInlineSnapshot(`
        NiceResponse {
          "status": 200,
          "body": { "nonce": <stripped field 'nonce'> },
          "headers": Headers { <some fields may have been hidden> },
        }
      `);
      const messages = await mailbox.fetchMessages({ noBody: true });
      const subjects = messages.map((message) => message.subject);
      const containsSubstring = subjects.some(str => str.includes("Sign in to"));
      expect(containsSubstring).toBe(true);
      return {
        sendSignInCodeResponse: response,
      };
    }

    export async function signIn() {
      const mailbox = backendContext.value.mailbox;
      const sendSignInCodeRes = await sendSignInCode();
      const messages = await mailbox.fetchMessages();
      const message = messages.findLast((message) => message.subject.includes("Sign in to")) ?? throwErr("Sign-in code message not found");
      const signInCode = message.body?.text.match(/http:\/\/localhost:12345\/some-callback-url\?code=([a-zA-Z0-9]+)/)?.[1] ?? throwErr("Sign-in URL not found");
      const response = await niceBackendFetch("/api/v1/auth/otp/sign-in", {
        method: "POST",
        accessType: "client",
        body: {
          code: signInCode,
        },
      });
      expect(response).toMatchObject({
        status: 200,
        body: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          is_new_user: expect.any(Boolean),
          user_id: expect.any(String),
        },
        headers: expect.anything(),
      });

      backendContext.set({
        userAuth: {
          accessToken: response.body.access_token,
          refreshToken: response.body.refresh_token,
        },
      });

      return {
        ...sendSignInCodeRes,
        userId: response.body.user_id,
        signInResponse: response,
      };
    }
  }

  export namespace Password {
    export async function signUpWithEmail(options: { password?: string } = {}) {
      const mailbox = backendContext.value.mailbox;
      const email = mailbox.emailAddress;
      const password = options.password ?? generateSecureRandomString();
      const response = await niceBackendFetch("/api/v1/auth/password/sign-up", {
        method: "POST",
        accessType: "client",
        body: {
          email,
          password,
          verification_callback_url: "http://localhost:12345/some-callback-url",
        },
      });
      expect(response).toMatchObject({
        status: 200,
        body: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          user_id: expect.any(String),
        },
        headers: expect.anything(),
      });

      backendContext.set({
        userAuth: {
          accessToken: response.body.access_token,
          refreshToken: response.body.refresh_token,
        },
      });

      return {
        signUpResponse: response,
        userId: response.body.user_id,
        email,
        password,
      };
    }

    export async function signInWithEmail(options: { password: string }) {
      const mailbox = backendContext.value.mailbox;
      const email = mailbox.emailAddress;
      const response = await niceBackendFetch("/api/v1/auth/password/sign-in", {
        method: "POST",
        accessType: "client",
        body: {
          email,
          password: options.password,
        },
      });
      expect(response).toMatchObject({
        status: 200,
        body: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          user_id: expect.any(String),
        },
        headers: expect.anything(),
      });

      backendContext.set({
        userAuth: {
          accessToken: response.body.access_token,
          refreshToken: response.body.refresh_token,
        },
      });

      return {
        signInResponse: response,
        userId: response.body.user_id,
      };
    }
  }

  export namespace OAuth {
    export async function getAuthorizeQuery() {
      const projectKeys = backendContext.value.projectKeys;
      if (projectKeys === "no-project") throw new Error("No project keys found in the backend context");

      return {
        client_id: projectKeys.projectId,
        client_secret: projectKeys.publishableClientKey ?? throwErr("No publishable client key found in the backend context"),
        redirect_uri: localRedirectUrl,
        scope: "legacy",
        response_type: "code",
        state: "this-is-some-state",
        grant_type: "authorization_code",
        code_challenge: "some-code-challenge",
        code_challenge_method: "plain",
      };
    }

    export async function authorize(options?: { redirectUrl?: string, errorRedirectUrl?: string }) {
      const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/spotify", {
        redirect: "manual",
        query: {
          ...await Auth.OAuth.getAuthorizeQuery(),
          ...filterUndefined({
            redirect_uri: options?.redirectUrl ?? undefined,
            error_redirect_uri: options?.errorRedirectUrl ?? undefined,
          }),
        },
      });
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toMatch(/^http:\/\/localhost:8114\/auth\?.*$/);
      expect(response.headers.get("set-cookie")).toMatch(/^stack-oauth-inner-[^;]+=[^;]+; Path=\/; Expires=[^;]+; Max-Age=\d+;( Secure;)? HttpOnly$/);
      return {
        authorizeResponse: response,
      };
    }

    export async function getInnerCallbackUrl(options?: { authorizeResponse: NiceResponse }) {
      options ??= await Auth.OAuth.authorize();
      const providerPassword = generateSecureRandomString();
      const authLocation = new URL(options.authorizeResponse.headers.get("location")!);
      const redirectResponse1 = await niceFetch(authLocation, {
        redirect: "manual",
      });
      expect(redirectResponse1).toEqual({
        status: 303,
        headers: expect.any(Headers),
        body: expect.any(String),
      });
      const signInInteractionLocation = new URL(redirectResponse1.headers.get("location") ?? throwErr("missing redirect location", { redirectResponse1 }), authLocation);
      const signInInteractionCookies = updateCookiesFromResponse("", redirectResponse1);
      const response1 = await niceFetch(signInInteractionLocation, {
        method: "POST",
        redirect: "manual",
        body: new URLSearchParams({
          prompt: "login",
          login: backendContext.value.mailbox.emailAddress,
          password: providerPassword,
        }),
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: signInInteractionCookies,
        },
      });
      expect(response1).toEqual({
        status: 303,
        headers: expect.any(Headers),
        body: expect.any(ArrayBuffer),
      });
      const redirectResponse2 = await niceFetch(new URL(response1.headers.get("location") ?? throwErr("missing redirect location", { response1 }), signInInteractionLocation), {
        redirect: "manual",
        headers: {
          cookie: updateCookiesFromResponse(signInInteractionCookies, response1),
        },
      });
      expect(redirectResponse2).toEqual({
        status: 303,
        headers: expect.any(Headers),
        body: expect.any(String),
      });
      const authorizeInteractionLocation = new URL(redirectResponse2.headers.get("location") ?? throwErr("missing redirect location", { redirectResponse2 }), authLocation);
      const authorizeInteractionCookies = updateCookiesFromResponse(signInInteractionCookies, redirectResponse2);
      const response2 = await niceFetch(authorizeInteractionLocation, {
        method: "POST",
        redirect: "manual",
        body: new URLSearchParams({
          prompt: "consent",
        }),
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: authorizeInteractionCookies,
        },
      });
      expect(response2).toEqual({
        status: 303,
        headers: expect.any(Headers),
        body: expect.any(ArrayBuffer),
      });
      const redirectResponse3 = await niceFetch(new URL(response2.headers.get("location") ?? throwErr("missing redirect location", { response2 }), authLocation), {
        redirect: "manual",
        headers: {
          cookie: updateCookiesFromResponse(authorizeInteractionCookies, response2),
        },
      });
      expect(redirectResponse3).toEqual({
        status: 303,
        headers: expect.any(Headers),
        body: expect.any(String),
      });
      const innerCallbackUrl = new URL(redirectResponse3.headers.get("location") ?? throwErr("missing redirect location", { redirectResponse3 }));
      expect(innerCallbackUrl.origin).toBe("http://localhost:8102");
      expect(innerCallbackUrl.pathname).toBe("/api/v1/auth/oauth/callback/spotify");
      return {
        ...options,
        innerCallbackUrl,
      };
    }

    export async function getAuthorizationCode(options?: { innerCallbackUrl: URL, authorizeResponse: NiceResponse }) {
      options ??= await Auth.OAuth.getInnerCallbackUrl();
      const cookie = updateCookiesFromResponse("", options.authorizeResponse);
      const response = await niceBackendFetch(options.innerCallbackUrl.toString(), {
        redirect: "manual",
        headers: {
          cookie,
        },
      });
      expect(response).toEqual({
        status: 302,
        headers: expect.any(Headers),
        body: {},
      });
      const outerCallbackUrl = new URL(response.headers.get("location") ?? throwErr("missing redirect location", { response }));
      expect(outerCallbackUrl.origin).toBe(new URL(localRedirectUrl).origin);
      expect(outerCallbackUrl.pathname).toBe(new URL(localRedirectUrl).pathname);
      expect(Object.fromEntries(outerCallbackUrl.searchParams.entries())).toEqual({
        code: expect.any(String),
        state: "this-is-some-state",
      });

      return {
        callbackResponse: response,
        outerCallbackUrl,
        authorizationCode: outerCallbackUrl.searchParams.get("code")!,
      };
    }

    export async function signIn() {
      const getAuthorizationCodeResult = await Auth.OAuth.getAuthorizationCode();

      const projectKeys = backendContext.value.projectKeys;
      if (projectKeys === "no-project") throw new Error("No project keys found in the backend context");

      const tokenResponse = await niceBackendFetch("/api/v1/auth/oauth/token", {
        method: "POST",
        accessType: "client",
        body: {
          client_id: projectKeys.projectId,
          client_secret: projectKeys.publishableClientKey ?? throwErr("No publishable client key found in the backend context"),
          code: getAuthorizationCodeResult.authorizationCode,
          redirect_uri: localRedirectUrl,
          code_verifier: "some-code-challenge",
          grant_type: "authorization_code",
        },
      });
      expect(tokenResponse).toMatchInlineSnapshot(`
        NiceResponse {
          "status": 200,
          "body": {
            "access_token": <stripped field 'access_token'>,
            "afterCallbackRedirectUrl": null,
            "after_callback_redirect_url": null,
            "expires_in": 3599,
            "is_new_user": true,
            "newUser": true,
            "refresh_token": <stripped field 'refresh_token'>,
            "scope": "legacy",
            "token_type": "Bearer",
          },
          "headers": Headers {
            "pragma": "no-cache",
            <some fields may have been hidden>,
          },
        }
      `);

      backendContext.set({
        userAuth: {
          accessToken: tokenResponse.body.access_token,
          refreshToken: tokenResponse.body.refresh_token,
        },
      });

      return {
        ...getAuthorizationCodeResult,
        tokenResponse,
      };
    }
  }

  export namespace Mfa {
    export async function setupTotpMfa() {
      const totpSecretBytes = crypto.getRandomValues(new Uint8Array(20));
      const totpSecretBase64 = encodeBase64(totpSecretBytes);
      const response = await niceBackendFetch("/api/v1/users/me", {
        accessType: "client",
        method: "PATCH",
        body: {
          totp_secret_base64: totpSecretBase64,
        },
      });
      expect(response).toMatchObject({
        status: 200,
      });

      return {
        setupTotpMfaResponse: response,
        totpSecret: totpSecretBytes,
      };
    }
  }
}

export namespace ContactChannels {
  export async function sendVerificationCode() {
    const mailbox = backendContext.value.mailbox;
    const response = await niceBackendFetch("/api/v1/contact-channels/send-verification-code", {
      method: "POST",
      accessType: "client",
      body: {
        email: mailbox.emailAddress,
        callback_url: "http://localhost:12345/some-callback-url",
      },
    });
    expect(response).toMatchInlineSnapshot(`
            NiceResponse {
              "status": 200,
              "body": { "success": true },
              "headers": Headers { <some fields may have been hidden> },
            }
          `);
    const messages = await mailbox.fetchMessages({ noBody: true });
    const subjects = messages.map((message) => message.subject);
    expect(subjects).toContain("Verify your email at Stack Dashboard");
    return {
      sendSignInCodeResponse: response,
    };
  }

  export async function verify() {
    const mailbox = backendContext.value.mailbox;
    const sendVerificationCodeRes = await sendVerificationCode();
    const messages = await mailbox.fetchMessages();
    const message = messages.findLast((message) => message.subject === "Verify your email at Stack Dashboard") ?? throwErr("Verification code message not found");
    const verificationCode = message.body?.text.match(/http:\/\/localhost:12345\/some-callback-url\?code=([a-zA-Z0-9]+)/)?.[1] ?? throwErr("Verification code not found");
    const response = await niceBackendFetch("/api/v1/contact-channels/verify", {
      method: "POST",
      accessType: "client",
      body: {
        code: verificationCode,
      },
    });
    expect(response).toMatchInlineSnapshot(`
          NiceResponse {
            "status": 200,
            "body": { "success": true },
            "headers": Headers { <some fields may have been hidden> },
          }
        `);
    return {
      ...sendVerificationCodeRes,
      verifyResponse: response,
    };
  }
}

export namespace ApiKey {
  export async function create(adminAccessToken?: string, body?: any) {
    const oldProjectKeys = backendContext.value.projectKeys;
    if (oldProjectKeys === 'no-project') {
      throw new Error("Cannot set API key context without a project");
    }

    const response = await niceBackendFetch("/api/v1/internal/api-keys", {
      accessType: "admin",
      method: "POST",
      body: {
        description: "test api key",
        has_publishable_client_key: true,
        has_secret_server_key: true,
        has_super_secret_admin_key: true,
        expires_at_millis: new Date().getTime() + 1000 * 60 * 60 * 24,
        ...body,
      },
      headers: {
        'x-stack-admin-access-token': adminAccessToken ?? (backendContext.value.projectKeys !== "no-project" && backendContext.value.projectKeys.adminAccessToken || throwErr("Missing adminAccessToken")),
      }
    });
    expect(response.status).equals(200);

    return {
      createApiKeyResponse: response,
      projectKeys: {
        projectId: oldProjectKeys.projectId,
        publishableClientKey: response.body.publishable_client_key,
        secretServerKey: response.body.secret_server_key,
        superSecretAdminKey: response.body.super_secret_admin_key,
      },
    };
  }

  export async function createAndSetProjectKeys(adminAccessToken?: string, body?: any) {
    const res = await ApiKey.create(adminAccessToken, body);
    backendContext.set({ projectKeys: res.projectKeys });
    return res;
  }
}

export namespace Project {
  export async function create(body?: any) {
    const response = await niceBackendFetch("/api/v1/internal/projects", {
      accessType: "client",
      method: "POST",
      body: {
        display_name: body?.display_name || 'New Project',
        ...body,
      },
    });
    expect(response).toMatchObject({
      status: 201,
      body: {
        id: expect.any(String),
      },
    });
    return {
      createProjectResponse: response,
      projectId: response.body.id as string,
    };
  }

  export async function updateCurrent(adminAccessToken: string, body: Partial<InternalProjectsCrud["Admin"]["Create"]>) {
    const response = await niceBackendFetch(`/api/v1/projects/current`, {
      accessType: "admin",
      method: "PATCH",
      body,
      headers: {
        'x-stack-admin-access-token': adminAccessToken,
      }
    });

    return {
      updateProjectResponse: response,
    };
  }

  export async function createAndGetAdminToken(body?: Partial<InternalProjectsCrud["Admin"]["Create"]>) {
    backendContext.set({
      projectKeys: InternalProjectKeys,
    });
    await Auth.Otp.signIn();
    const adminAccessToken = backendContext.value.userAuth?.accessToken;
    expect(adminAccessToken).toBeDefined();
    const { projectId, createProjectResponse } = await Project.create(body);

    backendContext.set({
      projectKeys: {
        projectId,
      },
      userAuth: null,
    });

    return {
      projectId,
      adminAccessToken: adminAccessToken!,
      createProjectResponse,
    };
  }

  export async function createAndSwitch(body?: Partial<InternalProjectsCrud["Admin"]["Create"]>) {
    const createResult = await Project.createAndGetAdminToken(body);
    backendContext.set({
      projectKeys: {
        projectId: createResult.projectId,
        adminAccessToken: createResult.adminAccessToken,
      },
    });
    return createResult;
  }
}

export namespace Team {
  export async function create(options: { accessType?: "client" | "server" } = {}, body?: any) {
    const response = await niceBackendFetch("/api/v1/teams", {
      accessType: options.accessType ?? "server",
      method: "POST",
      body: {
        display_name: body?.display_name || 'New Team',
        creator_user_id: 'me',
        ...body,
      },
    });
    return {
      createTeamResponse: response,
      teamId: response.body.id,
    };
  }

  export async function sendInvitation(receiveMailbox: Mailbox, teamId: string) {
    const response = await niceBackendFetch("/api/v1/team-invitations/send-code", {
      method: "POST",
      accessType: "client",
      body: {
        email: receiveMailbox.emailAddress,
        team_id: teamId,
        callback_url: "http://localhost:12345/some-callback-url",
      },
    });

    return {
      sendTeamInvitationResponse: response,
    };
  }

  export async function acceptInvitation() {
    const mailbox = backendContext.value.mailbox;
    const messages = await mailbox.fetchMessages();
    const message = messages.findLast((message) => message.subject.includes("join")) ?? throwErr("Team invitation message not found");
    const code = message.body?.text.match(/http:\/\/localhost:12345\/some-callback-url\?code=([a-zA-Z0-9]+)/)?.[1] ?? throwErr("Team invitation code not found");
    const response = await niceBackendFetch("/api/v1/team-invitations/accept", {
      method: "POST",
      accessType: "client",
      body: {
        code,
      },
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {},
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    return {
      acceptTeamInvitationResponse: response,
    };
  }
}
