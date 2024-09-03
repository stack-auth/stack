import { useId, useInsertionEffect } from "react";
import { Result } from "../utils/results";

type CacheInner = Map<unknown, CacheInner> | WeakMap<WeakKey, CacheInner> | { isNotNestedMap: true, value: any };

const cached = new Map<string, CacheInner>();

function unwrapFromInner(dependencies: any[], inner: CacheInner): Result<any, void> {
  if ((dependencies.length === 0) !== ("isNotNestedMap" in inner)) {
    return Result.error(undefined);
  }
  if ("isNotNestedMap" in inner) {
    if (dependencies.length === 0) {
      return Result.ok(inner.value);
    } else {
      return Result.error(undefined);
    }
  } else {
    if (dependencies.length === 0) {
      return Result.error(undefined);
    } else {
      const [key, ...rest] = dependencies;
      const newInner = inner.get(key);
      if (!newInner) {
        return Result.error(undefined);
      }
      return unwrapFromInner(rest, newInner);
    }
  }
}

function wrapToInner(dependencies: any[], value: any): CacheInner {
  if (dependencies.length === 0) {
    return { isNotNestedMap: true, value };
  }
  const [key, ...rest] = dependencies;
  const inner = wrapToInner(rest, value);

  const isObject = (typeof key === "object" && key !== null);
  const isUnregisteredSymbol = (typeof key === "symbol" && Symbol.keyFor(key) === undefined);
  const isWeak = isObject || isUnregisteredSymbol;
  const mapType = isWeak ? WeakMap : Map;

  return new mapType([[key, inner]]);
}

/**
 * Like memo, but minimizes recomputation of the value at all costs (instead of useMemo which recomputes whenever the renderer feels like it).
 *
 * The most recent value will be kept from garbage collection until one of the dependencies becomes unreachable. This may be true even after the component no longer renders. Be wary of memory leaks.
 */
export function useStrictMemo<T>(callback: () => T, dependencies: any[]): T {
  const id = useId();
  useInsertionEffect(() => {
    return () => {
      cached.delete(id);
    };
  }, [id]);

  const c = cached.get(id);
  if (c) {
    const unwrapped = unwrapFromInner(dependencies, c);
    if (unwrapped.status === "ok") {
      return unwrapped.data;
    }
  }
  const value = callback();
  cached.set(id, wrapToInner(dependencies, value));
  return value;
}
