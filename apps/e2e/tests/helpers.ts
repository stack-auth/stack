import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { omit } from "@stackframe/stack-shared/dist/utils/objects";
import { Nicifiable } from "@stackframe/stack-shared/dist/utils/strings";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
// eslint-disable-next-line no-restricted-imports
import { afterEach, beforeEach, test as vitestTest } from "vitest";

export const test: typeof vitestTest = vitestTest.extend({});
export const it: typeof vitestTest = test;

export class Context<R, T> {
  // we want to retain order in which the values were set instead of the order in which the beforeEach callback was called, so we keep a Map and a Set together here
  private _values = new Map<string, T>();
  private _yetToReduce = new Set<string>();
  private _deleteOnFinish = new Set<string>();

  private _reduced: R | undefined;
  private _withStorage: AsyncLocalStorage<T[]> = new AsyncLocalStorage();
  private _isInTest = false;

  constructor(private readonly _getInitialValue: () => R, private readonly _reducer: (acc: R, value: T) => R) {
    beforeEach(async () => {
      if (this._isInTest) {
        throw new StackAssertionError("beforeEach was called twice without a single afterEach! Are you running tests concurrently? This is not supported by withContext.");
      }
      if (this._withStorage.getStore()) {
        throw new StackAssertionError("Did you wrap an entire test into Context.with(...)?");
      }
      this._reduced = this._getInitialValue();
      this._isInTest = true;
      if (this._yetToReduce.size > 0) {
        throw new StackAssertionError("Something went wrong; _yetToReduce should be empty here.");
      }
    });
    afterEach(async () => {
      if (this._withStorage.getStore()) {
        throw new StackAssertionError("Test finished before _withStorage was cleaned up! This should not happen.");
      }
      this._isInTest = false;
      this._reduced = undefined;
      for (const key of this._deleteOnFinish) {
        this._yetToReduce.delete(key);
      }
      if (this._yetToReduce.size > 0) {
        throw new StackAssertionError("Something went wrong; _yetToReduce should be empty here.");
      }
    });
  }

  async with<X>(value: T, callback: () => Promise<X>) {
    const oldWithStorage = this._withStorage.getStore() ?? [];
    return await this._withStorage.run([...oldWithStorage, value], async () => {
      return await callback();
    });
  }

  set(value: T) {
    const randomId = generateSecureRandomString();
    this._values.set(randomId, value);
    const before = () => {
      if (this._yetToReduce.has(randomId)) {
        throw new StackAssertionError("Value setter was called twice without a single afterEach! Are you running tests concurrently? This is not supported by withContext.");
      }
      this._yetToReduce.add(randomId);
    };
    if (this._isInTest) {
      before();
      this._deleteOnFinish.add(randomId);
    } else {
      beforeEach(async () => {
        before();
      });
      afterEach(() => {
        this._yetToReduce.delete(randomId);
      });
    }
  }

  get value(): R {
    this._reduce();
    const _withStore = this._withStorage.getStore() ?? [];
    return _withStore.reduce((acc, val) => this._reducer(acc, val), this._reduced as R);
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

export function updateCookie(cookieString: string, cookieName: string, cookieValue: string) {
  const cookies = cookieString.split(";").map((cookie) => cookie.trim()).filter((cookie) => cookie.length > 0);
  const newCookie = `${cookieName}=${cookieValue}`;
  const cookieIndex = cookies.findIndex((cookie) => cookie.startsWith(`${cookieName}=`));
  if (cookieIndex === -1) {
    return `${cookieString}; ${newCookie}`;
  }
  cookies[cookieIndex] = newCookie;
  return cookies.join("; ");
}

export function updateCookiesFromResponse(cookieString: string, update: NiceResponse) {
  const setCookies = update.headers.getSetCookie();
  for (const setCookie of setCookies) {
    const [cookieName, cookieValue] = setCookie.split(";")[0].split("=");
    cookieString = updateCookie(cookieString, cookieName, cookieValue);
  }
  return cookieString;
}

export class NiceResponse implements Nicifiable {
  constructor(
    public readonly status: number,
    public readonly headers: Headers,
    public readonly body: any,
  ) {}

  getNicifiableKeys(): string[] {
    // reorder the keys for nicer printing
    return [
      "status",
      ...this.body instanceof ArrayBuffer && this.body.byteLength === 0 ? [] : ["body"],
      "headers",
    ];
  }
}

export type NiceRequestInit = RequestInit & {
  query?: Record<string, string>,
};

export async function niceFetch(url: string | URL, options?: NiceRequestInit): Promise<NiceResponse> {
  if (options?.query) {
    url = new URL(url);
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.append(key, value);
    }
  }
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

export const localRedirectUrl = "http://stack-test.localhost/some-callback-url";
export const localRedirectUrlRegex = /http:\/\/stack-test\.localhost\/some-callback-url([?#][A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?/g;

const generatedEmailSuffix = "@stack-generated.example.com";
export const generatedEmailRegex = /[a-zA-Z0-9_.+-]+@stack-generated\.example\.com/;

export type Mailbox = { emailAddress: string, fetchMessages: (options?: { noBody?: boolean }) => Promise<MailboxMessage[]> };
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
        "mailbox",
        "id",
        "size",
        "seen",
      ],
    });
  }
}

export function createMailbox(): Mailbox {
  const mailboxName = randomUUID();
  const fullMessageCache = new Map<string, any>();
  return {
    emailAddress: `${mailboxName}${generatedEmailSuffix}`,
    async fetchMessages({ noBody } = {}) {
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
        const messagePart = noBody ? omit(fullMessage, ["body", "attachments"]) : fullMessage;
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
