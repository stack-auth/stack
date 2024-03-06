import { DependenciesMap } from "./maps";
import { filterUndefined } from "./objects";
import { RateLimitOptions, ReactPromise, pending, rateLimited, resolved, runAsynchronously } from "./promises";
import { AsyncStore } from "./stores";

/**
 * Can be used to cache the result of a function call, for example for the `use` hook in React.
 */
export function cacheFunction<F extends Function>(f: F): F {
  const dependenciesMap = new DependenciesMap<any, any>();

  return ((...args: any) => {
    if (dependenciesMap.has(args)) {
      return dependenciesMap.get(args);
    }

    const value = f(...args);
    dependenciesMap.set(args, value);
    return value;
  }) as any as F;
}


type CacheStrategy = "write-only" | "read-write" | "never";

export class AsyncCache<D extends any[], T> {
  private readonly _map = new DependenciesMap<D, AsyncValueCache<T>>();

  constructor(
    private readonly _fetcher: (dependencies: D) => Promise<T>,
    private readonly _options: {
      onSubscribe?: (key: D, refresh: () => void) => (() => void),
      rateLimiter?: Omit<RateLimitOptions, "batchCalls">,
    } = {},
  ) {
    // nothing here yet
  }

  private _createKeyed<FunctionName extends keyof AsyncValueCache<T>>(
    functionName: FunctionName,
  ): (key: D, ...args: Parameters<AsyncValueCache<T>[FunctionName]>) => ReturnType<AsyncValueCache<T>[FunctionName]> {
    return (key: D, ...args) => {
      const valueCache = this.getValueCache(key);
      return (valueCache[functionName] as any).apply(valueCache, args);
    };
  }

  getValueCache(dependencies: D): AsyncValueCache<T> {
    let cache = this._map.get(dependencies);
    if (!cache) {
      cache = new AsyncValueCache(
        async () => await this._fetcher(dependencies),
        {
          ...this._options,
          onSubscribe: this._options.onSubscribe ? (cb) => this._options.onSubscribe!(dependencies, cb) : undefined,
        },
      );
      this._map.set(dependencies, cache);
    }
    return cache;
  }

  readonly isCacheAvailable = this._createKeyed("isCacheAvailable");
  readonly getIfCached = this._createKeyed("getIfCached");
  readonly getOrWait = this._createKeyed("getOrWait");
  readonly refresh = this._createKeyed("refresh");
  readonly invalidate = this._createKeyed("invalidate");
  readonly onChange = this._createKeyed("onChange");
}

class AsyncValueCache<T> {
  private _store: AsyncStore<T>;
  private _fetcher: () => Promise<T>;
  private readonly _rateLimitOptions: Omit<RateLimitOptions, "batchCalls">;
  private _subscriptionsCount = 0;
  private _unsubscribers: (() => void)[] = [];

  constructor(
    fetcher: () => Promise<T>,
    private readonly _options: {
      onSubscribe?: (refresh: () => void) => (() => void),
      rateLimiter?: Omit<RateLimitOptions, "batchCalls">,
    } = {},
  ) {
    this._store = new AsyncStore();
    this._rateLimitOptions = {
      concurrency: 1,
      debounceMs: 3_000,
      ...filterUndefined(_options.rateLimiter ?? {}),
    };


    this._fetcher = rateLimited(fetcher, {
      ...this._rateLimitOptions,
      batchCalls: true,
    });
  }

  isCacheAvailable(): boolean {
    return this._store.isAvailable();
  }

  getIfCached() {
    return this._store.get();
  }

  getOrWait(cacheStrategy: CacheStrategy): ReactPromise<T> {
    const cached = this.getIfCached();
    if (cacheStrategy === "read-write" && cached.status === "ok") {
      return resolved(cached.data);
    }

    return pending(this._refetch(cacheStrategy === "read-write" ? "write-only" : cacheStrategy));
  }

  private _set(value: T): void {
    this._store.set(value);
  }

  private async _setAsync(value: Promise<T>): Promise<boolean> {
    return await this._store.setAsync(value);
  }

  private async _refetch(cacheStrategy: "write-only" | "never"): Promise<T> {
    try {
      const res = this._fetcher();
      if (cacheStrategy === "write-only") {
        await this._setAsync(res);
      }
      return await res;
    } catch (e) {
      this._store.setRejected(e);
      throw e;
    }
  }

  async refresh(): Promise<T> {
    return await this.getOrWait("write-only");
  }

  async invalidate(): Promise<T> {
    this._store.setUnavailable();
    return await this.refresh();
  }

  onChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void } {
    const storeObj = this._store.onChange(callback);

    if (this._subscriptionsCount++ === 0 && this._options.onSubscribe) {
      const unsubscribe = this._options.onSubscribe(() => {
        runAsynchronously(this.refresh());
      });
      this._unsubscribers.push(unsubscribe);
    }

    runAsynchronously(this.refresh());

    let hasUnsubscribed = false;
    return {
      unsubscribe: () => {
        if (hasUnsubscribed) return;
        hasUnsubscribed = true;
        storeObj.unsubscribe();
        if (--this._subscriptionsCount === 0) {
          for (const unsubscribe of this._unsubscribers) {
            unsubscribe();
          }
        }
      },
    };
  }
}
