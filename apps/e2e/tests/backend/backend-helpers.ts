import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { STACK_BACKEND_BASE_URL, Context, STACK_INTERNAL_PROJECT_ADMIN_KEY, STACK_INTERNAL_PROJECT_CLIENT_KEY, STACK_INTERNAL_PROJECT_ID, STACK_INTERNAL_PROJECT_SERVER_KEY, Mailbox, NiceResponse, createMailbox, niceFetch } from "../helpers";
import { expect } from "vitest";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";

type BackendContext = {
  projectKeys: ProjectKeys,
  mailbox: Mailbox,
  userAuth: {
    refreshToken: string,
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
  publishableClientKey: string,
  secretServerKey: string,
  superSecretAdminKey: string,
};

export const InternalProjectKeys = {
  projectId: STACK_INTERNAL_PROJECT_ID,
  publishableClientKey: STACK_INTERNAL_PROJECT_CLIENT_KEY,
  secretServerKey: STACK_INTERNAL_PROJECT_SERVER_KEY,
  superSecretAdminKey: STACK_INTERNAL_PROJECT_ADMIN_KEY,
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

export async function niceBackendFetch(url: string, options?: Omit<RequestInit, "body"> & {
  accessType?: null | "client" | "server" | "admin",
  body?: unknown,
  headers?: Record<string, string>,
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
      ...projectKeys !== "no-project" ? {
        "x-stack-project-id": projectKeys.projectId,
        "x-stack-publishable-client-key": projectKeys.publishableClientKey,
        "x-stack-secret-server-key": projectKeys.secretServerKey,
        "x-stack-super-secret-admin-key": projectKeys.superSecretAdminKey,
      } : {},
      ...!userAuth ? {} : {
        "x-stack-access-token": userAuth.accessToken,
        "x-stack-refresh-token": userAuth.refreshToken,
      }, 
      ...Object.fromEntries(new Headers(headers).entries()),
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
  export namespace Otp {
    type SendSignInCodeResult = {
      sendSignInCodeResponse: NiceResponse,
    };
    export async function sendSignInCode(): Promise<SendSignInCodeResult> {
      const mailbox = backendContext.value.mailbox;
      const response = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
        method: "POST",
        accessType: "client",
        body: {
          email: mailbox.emailAddress,
          callback_url: "http://localhost:12345",
        },
      });
      expect(response).toMatchInlineSnapshot(`
        NiceResponse {
          "status": 200,
          "body": { "success": true },
          "headers": Headers {
            "x-stack-request-id": <stripped header 'x-stack-request-id'>,
            <some fields may have been hidden>,
          },
        }
      `);
      const messages = await mailbox.fetchMessages({ subjectOnly: true });
      const subjects = messages.map((message) => message.subject);
      expect(subjects).toContain("Sign in to Stack Dashboard");
      return {
        sendSignInCodeResponse: response,
      };
    }

    type SignInResult = SendSignInCodeResult & {
      signInResponse: NiceResponse,
    };
    export async function signIn(): Promise<SignInResult> {
      const mailbox = backendContext.value.mailbox;
      const sendSignInCodeRes = await sendSignInCode();
      const messages = await mailbox.fetchMessages();
      const message = messages.findLast((message) => message.subject === "Sign in to Stack Dashboard") ?? throwErr("Sign-in code message not found");
      const signInCode = message.body?.text.match(/http:\/\/localhost:12345\/\?code=([a-zA-Z0-9]+)/)?.[1] ?? throwErr("Sign-in URL not found");
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
        signInResponse: response,
      };
    }
  }

  export namespace Password {
    type SignUpResult = {
      signUpResponse: NiceResponse,
      email: string,
      password: string,
    };
    export async function signUpWithEmail(): Promise<SignUpResult> {
      const mailbox = backendContext.value.mailbox;
      const email = mailbox.emailAddress;
      const password = generateSecureRandomString();
      const response = await niceBackendFetch("/api/v1/auth/password/sign-up", {
        method: "POST",
        accessType: "client",
        body: {
          email,
          password,
          verification_callback_url: "http://localhost:12345",
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
        signUpResponse: response,
        email,
        password,
      };
    }
  }
}

export namespace Project{
  export async function createProject(options?: {
    displayName?: string,
  }) {
    const response = await niceBackendFetch("/api/v1/internal/projects", {
      accessType: "client",
      method: "POST",
      body: {
        display_name: options?.displayName || 'New Project',
      },
    });
    return {
      createProjectResponse: response,
      projectId: response.body.id,
    };
  }
}