import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { STACK_BACKEND_BASE_URL, Context, STACK_INTERNAL_PROJECT_ADMIN_KEY, STACK_INTERNAL_PROJECT_CLIENT_KEY, STACK_INTERNAL_PROJECT_ID, STACK_INTERNAL_PROJECT_SERVER_KEY, Mailbox, NiceResponse, createMailbox, niceFetch } from "../helpers";
import { expect } from "vitest";

type BackendContext = {
  projectKeys: ProjectKeys,
  mailbox: Mailbox,
};

export const backendContext = new Context<BackendContext, Partial<BackendContext>>(
  () => ({
    projectKeys: InternalProjectKeys,
    mailbox: createMailbox(),
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

export async function niceBackendFetch(url: string, options?: Omit<RequestInit, "body"> & {
  accessType?: null | "client" | "server" | "admin",
  body?: unknown,
  headers?: Record<string, string>,
}): Promise<NiceResponse> {
  const { body, headers, accessType, ...otherOptions } = options ?? {};
  const projectKeys = backendContext.value.projectKeys;
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
      ...Object.fromEntries(new Headers(headers).entries()),
    }),
  });
  if (res.headers.has("x-stack-known-error")) {
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);
    expect(res.body).toMatchObject({
      code: res.headers.get("x-stack-known-error"),
    });
  }
  return res;
}


type SendSignInCodeResult = {
  sendSignInCodeEndpointResponse: NiceResponse,
};
export async function sendSignInCode(options: {} = {}): Promise<SendSignInCodeResult> {
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      redirectUrl: "http://localhost:12345",
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
    sendSignInCodeEndpointResponse: response,
  };
}
