import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { Nicifiable } from "@stackframe/stack-shared/dist/utils/strings";
// eslint-disable-next-line no-restricted-imports
import { test as vitestTest } from "vitest";

export const test: typeof vitestTest = vitestTest.extend({});
export const it: typeof vitestTest = test;

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
    return ["status", "body", "headers"];
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

class MailboxMessage {
  constructor(json: any) {
    Object.assign(this, json);
  }

  getSnapshotSerializerOptions() {
    return ({
      stripFields: [],
      hideFields: [
        "posix-millis",
        "header",
        "date",
        "from",
        "to",
        "mailbox",
        "id",
        "size",
        "seen",
      ],
    });
  };
}

export function createMailbox(): { emailAddress: string, fetchMessages: (options?: { subjectOnly?: boolean }) => Promise<MailboxMessage[]> } {
  const mailboxName = generateSecureRandomString();
  return {
    emailAddress: `${mailboxName}@stack-test.example.com`,
    async fetchMessages({ subjectOnly } = {}) {
      const res = await niceFetch(new URL(`/api/v1/mailbox/${encodeURIComponent(mailboxName)}`, INBUCKET_API_URL));
      return await Promise.all((res.body as any[]).map(async (message) => {
        const fullMessageRes = await niceFetch(new URL(`/api/v1/mailbox/${encodeURIComponent(mailboxName)}/${message.id}`, INBUCKET_API_URL));
        const fullMessage: any = fullMessageRes.body;
        const messagePart = subjectOnly ? { subject: fullMessage.subject } : fullMessage;
        return new MailboxMessage(messagePart);
      }));
    },
  };
}

export const STACK_DASHBOARD_BASE_URL = getEnvVar("STACK_DASHBOARD_BASE_URL");
export const STACK_BACKEND_BASE_URL = getEnvVar("STACK_BACKEND_BASE_URL");
export const STACK_INTERNAL_PROJECT_ID = getEnvVar("STACK_INTERNAL_PROJECT_ID");
export const STACK_INTERNAL_PROJECT_CLIENT_KEY = getEnvVar("STACK_INTERNAL_PROJECT_CLIENT_KEY");
export const STACK_INTERNAL_PROJECT_SERVER_KEY = getEnvVar("STACK_INTERNAL_PROJECT_SERVER_KEY");
export const STACK_INTERNAL_PROJECT_ADMIN_KEY = getEnvVar("STACK_INTERNAL_PROJECT_ADMIN_KEY");

export const INBUCKET_API_URL = getEnvVar("INBUCKET_API_URL");
