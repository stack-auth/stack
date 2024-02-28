export type Result<T, E = unknown> =
  | {
    status: "ok",
    data: T,
  }
  | {
    status: "error",
    error: E,
  };

export type AsyncResult<T, E = unknown, P = void> =
  | Result<T, E>
  | & {
    status: "loading",
  }
  & (P extends void ? {} : { progress: P });

export const Result = {
  fromPromise: promiseToResult,
  ok<T>(data: T): Result<T, never> {
    return {
      status: "ok",
      data,
    };
  },
  error<E>(error: E): Result<never, E> {
    return {
      status: "error",
      error,
    };
  },
  map: mapResult,
  orThrow: <T, E>(result: Result<T, E>): T => {
    if (result.status === "error") throw result.error;
    return result.data;
  },
  orThrowAsync: async <T, E>(result: Promise<Result<T, E>>): Promise<T> => {
    return Result.orThrow(await result);
  }
};

function promiseToResult<T, E = unknown>(promise: Promise<T>): Promise<Result<T, E>> {
  return promise.then(data => ({
    status: "ok",
    data,
  }), error => ({
    status: "error",
    error,
  }));
}

function mapResult<T, U, E = unknown, P = unknown>(result: Result<T, E>, fn: (data: T) => U): Result<U, E>;
function mapResult<T, U, E = unknown, P = unknown>(result: AsyncResult<T, E, P>, fn: (data: T) => U): AsyncResult<U, E, P>;
function mapResult<T, U, E = unknown, P = unknown>(result: AsyncResult<T, E, P>, fn: (data: T) => U): AsyncResult<U, E, P> {
  if (result.status === "error") return {
    status: "error",
    error: result.error,
  };
  if (result.status === "loading") return {
    status: "loading",
    ..."progress" in result ? { progress: result.progress } : {},
  } as any;

  return Result.ok(fn(result.data));
}