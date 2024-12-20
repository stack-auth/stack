import { DependenciesMap } from "./maps";
import { filterUndefined } from "./objects";
import { RateLimitOptions, ReactPromise, pending, rateLimited, resolved, runAsynchronously, wait } from "./promises";
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

  async refreshWhere(predicate: (dependencies: D) => boolean) {
    const promises: Promise<T>[] = [];
    for (const [dependencies, cache] of this._map) {
      if (predicate(dependencies)) {
        promises.push(cache.refresh());
      }
    }
    await Promise.all(promises);
  }

  readonly isCacheAvailable = this._createKeyed("isCacheAvailable");
  readonly getIfCached = this._createKeyed("getIfCached");
  readonly getOrWait = this._createKeyed("getOrWait");
  readonly forceSetCachedValue = this._createKeyed("forceSetCachedValue");
  readonly forceSetCachedValueAsync = this._createKeyed("forceSetCachedValueAsync");
  readonly refresh = this._createKeyed("refresh");
  readonly invalidate = this._createKeyed("invalidate");
  readonly onStateChange = this._createKeyed("onStateChange");
}

class AsyncValueCache<T> {
  private _store: AsyncStore<T>;
  private _pendingPromise: ReactPromise<T> | undefined;
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
      throttleMs: 300,
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

    return this._refetch(cacheStrategy);
  }

  private _set(value: T): void {
    this._store.set(value);
  }

  private _setAsync(value: Promise<T>): ReactPromise<boolean> {
    const promise = pending(value);
    this._pendingPromise = promise;
    return pending(this._store.setAsync(promise));
  }

  private _refetch(cacheStrategy: CacheStrategy): ReactPromise<T> {
    if (cacheStrategy === "read-write" && this._pendingPromise) {
      return this._pendingPromise;
    }
    const promise = pending(this._fetcher());
    if (cacheStrategy === "never") {
      return promise;
    }
    return pending(this._setAsync(promise).then(() => promise));
  }

  forceSetCachedValue(value: T): void {
    this._set(value);
  }

  forceSetCachedValueAsync(value: Promise<T>): ReactPromise<boolean> {
    return this._setAsync(value);
  }

  /**
   * Refetches the value from the fetcher, and updates the cache with it.
   */
  async refresh(): Promise<T> {
    return await this.getOrWait("write-only");
  }

  /**
   * Invalidates the cache, marking it to refresh on the next read. If anyone was listening to it, it will refresh
   * immediately.
   */
  invalidate(): void {
    this._store.setUnavailable();
    this._pendingPromise = undefined;
    if (this._subscriptionsCount > 0) {
      runAsynchronously(this.refresh());
    }
  }

  onStateChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void } {
    const storeObj = this._store.onChange(callback);

    runAsynchronously(this.getOrWait("read-write"));

    if (this._subscriptionsCount++ === 0 && this._options.onSubscribe) {
      let mostRecentRefreshPromiseIndex = 0;
      const unsubscribe = this._options.onSubscribe(() => {
        const currentRefreshPromiseIndex = mostRecentRefreshPromiseIndex++;
        runAsynchronously(async () => {
          // wait a few seconds; if anything changes during that time, we don't want to refresh
          // else we do unnecessary requests if we unsubscribe and then subscribe again immediately
          await wait(5000);
          if (this._subscriptionsCount === 0 && currentRefreshPromiseIndex === mostRecentRefreshPromiseIndex) {
            this.invalidate();
          }
        });
      });
      this._unsubscribers.push(unsubscribe);
    }

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
