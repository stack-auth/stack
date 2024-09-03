import { wait } from "./promises";
import { deindent } from "./strings";

export type Result<T, E = unknown> =
  | {
      status: "ok";
      data: T;
    }
  | {
      status: "error";
      error: E;
    };

export type AsyncResult<T, E = unknown, P = void> =
  | Result<T, E>
  | ({
      status: "pending";
    } & {
      progress: P;
    });

export const Result = {
  fromThrowing,
  fromThrowingAsync,
  fromPromise: promiseToResult,
  ok<T>(data: T): Result<T, never> & { status: "ok" } {
    return {
      status: "ok",
      data,
    };
  },
  error<E>(error: E): Result<never, E> & { status: "error" } {
    return {
      status: "error",
      error,
    };
  },
  map: mapResult,
  or: <T, E, U>(result: Result<T, E>, fallback: U): T | U => {
    return result.status === "ok" ? result.data : fallback;
  },
  orThrow: <T, E>(result: Result<T, E>): T => {
    if (result.status === "error") throw result.error;
    return result.data;
  },
  orThrowAsync: async <T, E>(result: Promise<Result<T, E>>): Promise<T> => {
    return Result.orThrow(await result);
  },
  retry,
};

export const AsyncResult = {
  fromThrowing,
  fromPromise: promiseToResult,
  ok: Result.ok,
  error: Result.error,
  pending,
  map: mapResult,
  or: <T, E, P, U>(result: AsyncResult<T, E, P>, fallback: U): T | U => {
    if (result.status === "pending") return fallback;
    return Result.or(result, fallback);
  },
  orThrow: <T, E, P>(result: AsyncResult<T, E, P>): T => {
    if (result.status === "pending") throw new Error("Result still pending");
    return Result.orThrow(result);
  },
  retry,
};

function pending(): AsyncResult<never, never, void> & { status: "pending" };
function pending<P>(progress: P): AsyncResult<never, never, P> & { status: "pending" };
function pending<P>(progress?: P): AsyncResult<never, never, P> & { status: "pending" } {
  return {
    status: "pending",
    progress: progress!,
  };
}

async function promiseToResult<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const value = await promise;
    return Result.ok(value);
  } catch (error) {
    return Result.error(error);
  }
}

function fromThrowing<T>(fn: () => T): Result<T, unknown> {
  try {
    return Result.ok(fn());
  } catch (error) {
    return Result.error(error);
  }
}

async function fromThrowingAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
  try {
    return Result.ok(await fn());
  } catch (error) {
    return Result.error(error);
  }
}

function mapResult<T, U, E = unknown>(result: Result<T, E>, fn: (data: T) => U): Result<U, E>;
function mapResult<T, U, E = unknown, P = unknown>(result: AsyncResult<T, E, P>, fn: (data: T) => U): AsyncResult<U, E, P>;
function mapResult<T, U, E = unknown, P = unknown>(result: AsyncResult<T, E, P>, fn: (data: T) => U): AsyncResult<U, E, P> {
  if (result.status === "error")
    return {
      status: "error",
      error: result.error,
    };
  if (result.status === "pending")
    return {
      status: "pending",
      ...("progress" in result ? { progress: result.progress } : {}),
    } as any;

  return Result.ok(fn(result.data));
}

class RetryError extends AggregateError {
  constructor(public readonly errors: unknown[]) {
    const strings = errors.map((e) => String(e));
    const isAllSame = strings.length > 1 && strings.every((s) => s === strings[0]);
    super(
      errors,
      deindent`
      Error after retrying ${errors.length} times.

      ${
        isAllSame
          ? deindent`
        Attempts 1-${errors.length}:
          ${errors[0]}
      `
          : errors
              .map(
                (e, i) => deindent`
          Attempt ${i + 1}:
            ${e}
        `,
              )
              .join("\n\n")
      }
      `,
      { cause: errors[errors.length - 1] },
    );
    this.name = "RetryError";
  }

  get retries() {
    return this.errors.length;
  }
}
RetryError.prototype.name = "RetryError";

async function retry<T>(
  fn: () => Result<T> | Promise<Result<T>>,
  retries: number,
  { exponentialDelayBase = 2000 },
): Promise<Result<T, RetryError>> {
  const errors: unknown[] = [];
  for (let i = 0; i < retries; i++) {
    const res = await fn();
    if (res.status === "ok") {
      return Result.ok(res.data);
    } else {
      errors.push(res.error);
      if (i < retries - 1) {
        await wait(Math.random() * exponentialDelayBase * 2 ** i);
      }
    }
  }
  return Result.error(new RetryError(errors));
}
