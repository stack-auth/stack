import { Result } from "./results";
import { generateUuid } from "./uuids";

export async function neverResolve() {
  return await new Promise<never>(() => {});
}

export async function wait(ms: number) {
  return await new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function waitUntil(date: Date) {
  return await wait(date.getTime() - Date.now());
}

export function runAsynchronously(promiseOrFunc: Promise<unknown> | (() => Promise<unknown>) | undefined): void {
  if (typeof promiseOrFunc === "function") {
    promiseOrFunc = promiseOrFunc();
  }
  promiseOrFunc?.catch(error => {
    const newError = new Error(
      "Uncaught error in asynchronous function: " + error.toString(),
      {
        cause: error,
      }
    );
    console.error(newError);
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
