import { StackAssertionError, captureError } from "./errors";
import { Result } from "./results";
import { generateUuid } from "./uuids";
import type { RejectedThenable, FulfilledThenable, PendingThenable } from "react";

export type ReactPromise<T> = Promise<T> & (
  | RejectedThenable<T>
  | FulfilledThenable<T>
  | PendingThenable<T>
);

type Resolve<T> = (value: T) => void;
type Reject = (reason: unknown) => void;
export function createPromise<T>(callback: (resolve: Resolve<T>, reject: Reject) => void): ReactPromise<T> {
  let status = "pending" as "fulfilled" | "rejected" | "pending";
  let valueOrReason: T | unknown | undefined = undefined;
  let resolve: Resolve<T> | null = null;
  let reject: Reject | null = null;
  const promise = new Promise<T>((res, rej) => {
    resolve = (value) => {
      if (status !== "pending") return;
      status = "fulfilled";
      valueOrReason = value;
      res(value);
    };
    reject = (reason) => {
      if (status !== "pending") return;
      status = "rejected";
      valueOrReason = reason;
      rej(reason);
    };
  });

  callback(resolve!, reject!);
  return Object.assign(promise, {
    status: status,
    ...status === "fulfilled" ? { value: valueOrReason as T } : {},
    ...status === "rejected" ? { reason: valueOrReason } : {},
  } as any);
}

/**
 * Like Promise.resolve(...), but also adds the status and value properties for use with React's `use` hook.
 */
export function resolved<T>(value: T): ReactPromise<T> {
  return Object.assign(Promise.resolve(value), {
    status: "fulfilled",
    value,
  } as const);
}

/**
 * Like Promise.resolve(...), but also adds the status and value properties for use with React's `use` hook.
 */
export function rejected<T>(reason: unknown): ReactPromise<T> {
  return Object.assign(Promise.reject(reason), {
    status: "rejected",
    reason: reason,
  } as const);
}

export function neverResolve(): ReactPromise<never> {
  return pending(new Promise<never>(() => {}));
}

export function pending<T>(promise: Promise<T>, options: { disableErrorWrapping?: boolean } = {}): ReactPromise<T> {
  const res = promise.then(
    value => {
      res.status = "fulfilled";
      (res as any).value = value;
      return value;
    },
    actualReason => {
      res.status = "rejected";
      (res as any).reason = actualReason;
      throw actualReason;
    },
  ) as ReactPromise<T>;
  res.status = "pending";
  return res;
}

export async function wait(ms: number) {
  return await new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function waitUntil(date: Date) {
  return await wait(date.getTime() - Date.now());
}

class ErrorDuringRunAsynchronously extends Error {
  constructor() {
    super("The error above originated in a runAsynchronously() call. Here is the stacktrace associated with it.");
    this.name = "ErrorDuringRunAsynchronously";
  }
}

export function runAsynchronously(
  promiseOrFunc: void | Promise<unknown> | (() => void | Promise<unknown>) | undefined,
  options: {
    ignoreErrors?: boolean,
  } = {},
): void {
  if (typeof promiseOrFunc === "function") {
    promiseOrFunc = promiseOrFunc();
  }
  const duringError = new ErrorDuringRunAsynchronously();
  promiseOrFunc?.catch(error => {
    const newError = new StackAssertionError(
      "Uncaught error in asynchronous function: " + error.toString(),
      {
        duringError,
      },
      {
        cause: error,
      }
    );
    if (!options.ignoreErrors) {
      captureError("runAsynchronously", newError);
    }
  });
}


class TimeoutError extends Error {
  constructor(public readonly ms: number) {
    super(`Timeout after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export async function timeout<T>(promise: Promise<T>, ms: number): Promise<Result<T, TimeoutError>> {
  return await Promise.race([
    promise.then(value => Result.ok(value)),
    wait(ms).then(() => Result.error(new TimeoutError(ms))),
  ]);
}

export async function timeoutThrow<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Result.orThrow(await timeout(promise, ms));
}


export type RateLimitOptions = {
  /**
   * The number of requests to process in parallel. Currently only 1 is supported.
   */
  concurrency: 1,

  /**
   * If true, multiple requests waiting at the same time will be reduced to just one. Default is false.
   */
  batchCalls?: boolean,

  /**
   * Waits for throttleMs since the start of last request before starting the next request. Default is 0.
   */
  throttleMs?: number,

  /**
   * Waits for gapMs since the end of last request before starting the next request. Default is 0.
   */
  gapMs?: number,

  /**
   * Waits until there have been no new requests for debounceMs before starting a new request. Default is 0.
   */
  debounceMs?: number,
};

export function rateLimited<T>(
  func: () => Promise<T>,
  options: RateLimitOptions,
): () => Promise<T> {
  let waitUntil = performance.now();
  let queue: [(t: T) => void, (e: unknown) => void][] = [];
  let addedToQueueCallbacks = new Map<string, () => void>;

  const next = async () => {
    while (true) {
      if (waitUntil > performance.now()) {
        await wait(Math.max(1, waitUntil - performance.now() + 1));
      } else if (queue.length === 0) {
        const uuid = generateUuid();
        await new Promise<void>(resolve => {
          addedToQueueCallbacks.set(uuid, resolve);
        });
        addedToQueueCallbacks.delete(uuid);
      } else {
        break;
      }
    }
    const nextFuncs = options.batchCalls ? queue.splice(0, queue.length) : [queue.shift()!];
    
    const start = performance.now();
    const value = await Result.fromPromise(func());
    const end = performance.now();

    waitUntil = Math.max(
      waitUntil,
      start + (options.throttleMs ?? 0),
      end + (options.gapMs ?? 0),
    );

    for (const nextFunc of nextFuncs) {
      value.status === "ok" ? nextFunc[0](value.data) : nextFunc[1](value.error);
    }
  };

  runAsynchronously(async () => {
    while (true) {
      await next();
    }
  });

  return () => {
    return new Promise<T>((resolve, reject) => {
      waitUntil = Math.max(
        waitUntil,
        performance.now() + (options.debounceMs ?? 0),
      );
      queue.push([resolve, reject]);
      addedToQueueCallbacks.forEach(cb => cb());
    });
  };
}

export function throttled<T, A extends any[]>(func: (...args: A) => Promise<T>, delayMs: number): (...args: A) => Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let nextAvailable: Promise<T> | null = null;
  return async (...args) => {
    while (nextAvailable !== null) {
      await nextAvailable;
    }
    nextAvailable = new Promise<T>(resolve => {
      timeout = setTimeout(() => {
        nextAvailable = null;
        resolve(func(...args));
      }, delayMs);
    });
    return await nextAvailable;
  };
}
