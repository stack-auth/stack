import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { Nicifiable } from "@stackframe/stack-shared/dist/utils/strings";
import { afterEach } from "node:test";
// eslint-disable-next-line no-restricted-imports
import { beforeEach, onTestFinished, test as vitestTest } from "vitest";

export const test: typeof vitestTest = vitestTest.extend({});
export const it: typeof vitestTest = test;

export class Context<R, T> {
  // we want to retain order in which the values were set instead of the order in which the beforeEach callback was called, so we keep a Map and a Set together here
  private _values = new Map<string, T>();
  private _yetToReduce = new Set<string>();

  private _reduced: R | undefined;
  private _isInTest = false;

  constructor(private readonly _getInitialValue: () => R, private readonly _reducer: (acc: R, value: T) => R) {
    beforeEach(async () => {
      if (this._isInTest) {
        throw new StackAssertionError("beforeEach was called twice without a single afterEach! Are you running tests concurrently? This is not supported by withContext.");
      }
      this._reduced = this._getInitialValue();
      this._isInTest = true;
      if (this._yetToReduce.size > 0) {
        throw new StackAssertionError("Something went wrong; _yetToReduce should be empty here.");
      }
     
      // we use onTestFinished instead of afterEach so that afterEach calls can still use the context
      onTestFinished(async () => {
        this._isInTest = false;
        this._reduced = undefined;
        this._yetToReduce.clear();
      });
    });
  }

  set(value: T) {
    const randomId = generateSecureRandomString();
    this._values.set(randomId, value);
    const before = () => {
      if (this._yetToReduce.has(randomId)) {
        throw new StackAssertionError("beforeEach was called twice without a single afterEach! Are you running tests concurrently? This is not supported by withContext.");
      }
      this._yetToReduce.add(randomId);
    };
    if (this._isInTest) {
      before();
    } else {
      beforeEach(before);
    }
  }

  get value(): R {
    this._reduce();
    return this._reduced as R;
  }

  private _reduce() {
    if (!this._isInTest) {
      throw new StackAssertionError("You can only call this function on Context inside a test.");
    }
    const yetToReduceOrdered = [...this._values.entries()].filter(([key]) => this._yetToReduce.has(key)).map(([, value]) => value);
    for (const value of yetToReduceOrdered) {
      this._reduced = this._reducer(this._reduced as R, value);
    }
    this._yetToReduce = new Set();
  }
}

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


export type Mailbox = { emailAddress: string, fetchMessages: (options?: { subjectOnly?: boolean }) => Promise<MailboxMessage[]> };

export class MailboxMessage {
  declare public readonly subject: string;
  declare public readonly from: string;
  declare public readonly to: string;
  declare public readonly date: string;
  declare public readonly id: string;
  declare public readonly size: number;
  declare public readonly seen: boolean;
  declare public readonly "posix-millis": number;
  declare public readonly header?: any;
  declare public readonly body?: { text: string, html: string };
  declare public readonly attachments?: any[];

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

export function createMailbox(): Mailbox {
  const mailboxName = generateSecureRandomString();
  const fullMessageCache = new Map<string, any>();
  return {
    emailAddress: `${mailboxName}@stack-test.example.com`,
    async fetchMessages({ subjectOnly } = {}) {
      const res = await niceFetch(new URL(`/api/v1/mailbox/${encodeURIComponent(mailboxName)}`, INBUCKET_API_URL));
      return await Promise.all((res.body as any[]).map(async (message) => {
        let fullMessage: any;
        if (fullMessageCache.has(message.id)) {
          fullMessage = fullMessageCache.get(message.id);
        } else {
          const fullMessageRes = await niceFetch(new URL(`/api/v1/mailbox/${encodeURIComponent(mailboxName)}/${message.id}`, INBUCKET_API_URL));
          fullMessage = fullMessageRes.body;
          fullMessageCache.set(message.id, fullMessage);
        }
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
