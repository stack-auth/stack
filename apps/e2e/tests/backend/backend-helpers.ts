import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { STACK_BACKEND_BASE_URL, STACK_INTERNAL_PROJECT_ADMIN_KEY, STACK_INTERNAL_PROJECT_CLIENT_KEY, STACK_INTERNAL_PROJECT_SERVER_KEY, NiceResponse, niceFetch } from "../helpers";
import { expect } from "vitest";

export async function niceBackendFetch(url: string, options?: Omit<RequestInit, "body"> & {
  accessType?: null | "client" | "server" | "admin",
  body?: unknown,
  internalProject?: boolean,
  headers?: Record<string, string>,
}): Promise<NiceResponse> {
  const { body, headers, internalProject, accessType, ...otherOptions } = options ?? {};
  const res = await niceFetch(new URL(url, STACK_BACKEND_BASE_URL), {
    ...otherOptions,
    ...body !== undefined ? { body: JSON.stringify(body) } : {},
    headers: filterUndefined({
      "content-type": body !== undefined ? "application/json" : undefined,
      "x-stack-access-type": accessType ?? undefined,
      ...internalProject ? {
        "x-stack-project-id": "internal",
        "x-stack-publishable-client-key": STACK_INTERNAL_PROJECT_CLIENT_KEY,
        "x-stack-secret-server-key": STACK_INTERNAL_PROJECT_SERVER_KEY,
        "x-stack-super-secret-admin-key": STACK_INTERNAL_PROJECT_ADMIN_KEY,
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
