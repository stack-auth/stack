import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { expect } from "vitest";
import { Context, Mailbox, NiceRequestInit, NiceResponse, STACK_BACKEND_BASE_URL, STACK_INTERNAL_PROJECT_ADMIN_KEY, STACK_INTERNAL_PROJECT_CLIENT_KEY, STACK_INTERNAL_PROJECT_ID, STACK_INTERNAL_PROJECT_SERVER_KEY, createMailbox, niceFetch } from "../helpers";

type BackendContext = {
  projectKeys: ProjectKeys,
  mailbox: Mailbox,
  userAuth: {
    refreshToken?: string,
    accessToken?: string,
  } | null,
};

export const backendContext = new Context<BackendContext, Partial<BackendContext>>(
  () => ({
    projectKeys: InternalProjectKeys,
    mailbox: createMailbox(),
    userAuth: null,
  }),
  (acc, update) => ({
    ...acc,
    ...filterUndefined(update),
  }),
);

export type ProjectKeys = "no-project" | {
  projectId: string,
  publishableClientKey?: string,
  secretServerKey?: string,
  superSecretAdminKey?: string,
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
      if (key.match(/[a-z0-9][A-Z][a-z0-9]+/) && !key.includes("_")) {
        throw new StackAssertionError(`Object has camelCase key (expected snake case): ${path}.${key}`);
      }
      expectSnakeCase(value, `${path}.${key}`);
    }
  }
}

export async function niceBackendFetch(url: string, options?: Omit<NiceRequestInit, "body" | "headers"> & {
  accessType?: null | "client" | "server" | "admin",
  body?: unknown,
  headers?: Record<string, string | undefined>,
}): Promise<NiceResponse> {
  const { body, headers, accessType, ...otherOptions } = options ?? {};
  if (typeof body === "object") {
    expectSnakeCase(body, "req.body");
  }
  const { projectKeys, userAuth } = backendContext.value;
  const res = await niceFetch(new URL(url, STACK_BACKEND_BASE_URL), {
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
      } : {},
      "x-stack-access-token": userAuth?.accessToken,
      "x-stack-refresh-token": userAuth?.refreshToken,
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
  export async function expectToBeSignedIn() {
    const response = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
    expect(response).toEqual({
      status: 200,
      headers: expect.anything(),
      body: expect.anything(),
    });
  }

  export async function expectToBeSignedOut() {
    const response = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "CANNOT_GET_OWN_USER_WITHOUT_USER",
          "error": "You have specified 'me' as a userId, but did not provide authentication for a user.",
        },
        "headers": Headers {
          "x-stack-known-error": "CANNOT_GET_OWN_USER_WITHOUT_USER",
          <some fields may have been hidden>,
        },
      }
    `);
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
    if (backendContext.value.userAuth) backendContext.value.userAuth.accessToken = undefined;
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
          "body": { "success": true },
          "headers": Headers { <some fields may have been hidden> },
        }
      `);
      const messages = await mailbox.fetchMessages({ noBody: true });
      const subjects = messages.map((message) => message.subject);
      expect(subjects).toContain("Sign in to Stack Dashboard");
      return {
        sendSignInCodeResponse: response,
      };
    }

    export async function signIn() {
      const mailbox = backendContext.value.mailbox;
      const sendSignInCodeRes = await sendSignInCode();
      const messages = await mailbox.fetchMessages();
      const message = messages.findLast((message) => message.subject === "Sign in to Stack Dashboard") ?? throwErr("Sign-in code message not found");
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
  export async function create(adminAccessToken: string, body?: any) {
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
        'x-stack-admin-access-token': adminAccessToken,
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

  export async function createAndSetProjectKeys(adminAccessToken: string, body?: any) {
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
    return {
      createProjectResponse: response,
      projectId: response.body.id,
    };
  }

  export async function updateCurrent(adminAccessToken: string, body: any) {
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

  export async function createAndSetAdmin(body?: any) {
    backendContext.set({
      projectKeys: InternalProjectKeys,
    });
    await Auth.Otp.signIn();
    const { projectId, createProjectResponse } = await Project.create(body);
    const adminAccessToken = backendContext.value.userAuth?.accessToken;

    expect(adminAccessToken).toBeDefined();

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
}

export namespace Team {
  export async function create(options: { accessType?: "client" | "server" } = {}, body?: any) {
    const response = await niceBackendFetch("/api/v1/teams?add_current_user=true", {
      accessType: options.accessType ?? "client",
      method: "POST",
      body: {
        display_name: body?.display_name || 'New Team',
        ...body,
      },
    });
    return {
      createTeamResponse: response,
      teamId: response.body.id,
    };
  }
}
