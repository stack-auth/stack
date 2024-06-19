import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { STACK_BACKEND_BASE_URL, STACK_INTERNAL_PROJECT_ADMIN_KEY, STACK_INTERNAL_PROJECT_CLIENT_KEY, STACK_INTERNAL_PROJECT_SERVER_KEY, NiceResponse, niceFetch } from "../helpers";
import { expect } from "vitest";

export async function niceBackendFetch(url: string, options?: RequestInit & {
  accessType?: null | "client" | "server" | "admin",
  internalProject?: boolean,
  headers?: Record<string, string>,
}): Promise<NiceResponse> {
  const res = await niceFetch(new URL(url, STACK_BACKEND_BASE_URL), {
    ...options,
    headers: filterUndefined({
      "x-stack-access-type": options?.accessType ?? undefined,
      ...options?.internalProject ? {
        "x-stack-project-id": "internal",
        "x-stack-publishable-client-key": STACK_INTERNAL_PROJECT_CLIENT_KEY,
        "x-stack-secret-server-key": STACK_INTERNAL_PROJECT_SERVER_KEY,
        "x-stack-super-secret-admin-key": STACK_INTERNAL_PROJECT_ADMIN_KEY,
      } : {},
      ...Object.fromEntries(new Headers(options?.headers).entries()),
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
