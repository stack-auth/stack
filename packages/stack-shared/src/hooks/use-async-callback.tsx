import React from "react";

export function useAsyncCallback<A extends any[], R>(
  callback: (...args: A) => Promise<R>,
  deps: React.DependencyList
): [cb: (...args: A) => Promise<R>, loading: boolean, error: unknown | undefined] {
  const [error, setError] = React.useState<unknown | undefined>(undefined);
  const [loadingCount, setLoadingCount] = React.useState(0);

  const cb = React.useCallback(
    async (...args: A) => {
      setLoadingCount((c) => c + 1);
      try {
        return await callback(...args);
      } catch(e) {
        setError(e);
        throw e;
      } finally {
        setLoadingCount((c) => c - 1);
      }
    },
    deps,
  );

  return [cb, loadingCount > 0, error];
}

export function useAsyncCallbackWithLoggedError<A extends any[], R>(
  callback: (...args: A) => Promise<R>,
  deps: React.DependencyList
): [cb: (...args: A) => Promise<R>, loading: boolean] {
  const [newCallback, loading] = useAsyncCallback<A, R>(async (...args) => {
    try {
      return await callback(...args);
    } catch (e) {
      console.error("Uncaught error in async callback", e);
      throw e;
    }
  }, deps);

  return [newCallback, loading];
}
