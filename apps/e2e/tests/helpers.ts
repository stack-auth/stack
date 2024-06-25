import { Nicifiable } from "@stackframe/stack-shared/dist/utils/strings";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}


export class NiceResponse implements Nicifiable {
  constructor(
    public readonly status: number,
    public readonly headers: Headers,
    public readonly body: unknown,
  ) {}

  getNicifiableKeys(): string[] {
    // reorder the keys for nicer printing
    return ["status", "headers", "body"];
  }
};

export async function niceFetch(url: string | URL, options?: RequestInit): Promise<NiceResponse> {
  const fetchRes = await fetch(url, options);
  let body;
  if (fetchRes.headers.get("content-type")?.includes("application/json")) {
    body = await fetchRes.json();
  } else if (fetchRes.headers.get("content-type")?.includes("text")) {
    body = await fetchRes.text();
  } else {
    body = await fetchRes.arrayBuffer();
  }
  return new NiceResponse(fetchRes.status, fetchRes.headers, body);
}

export const DASHBOARD_BASE_URL = getEnvVar("DASHBOARD_BASE_URL");
export const BACKEND_BASE_URL = getEnvVar("BACKEND_BASE_URL");
export const INTERNAL_PROJECT_ID = getEnvVar("INTERNAL_PROJECT_ID");
export const INTERNAL_PROJECT_CLIENT_KEY = getEnvVar("INTERNAL_PROJECT_CLIENT_KEY");
