import { RateLimitOptions, rateLimited, runAsynchronously } from "./promises";
import { Result } from "./results";
import { AsyncStore, ReadonlyAsyncStore } from "./stores";

export class AsyncCache<K, T> {
  private _map: Map<K, AsyncValueCache<T>> = new Map();

  constructor(
    private readonly _fetcher: (key: K, isFirst: boolean) => Promise<T>,
    private readonly _rateLimitOptions: Omit<RateLimitOptions, "batchCalls"> = { concurrency: 1, gapMs: 3_000 },
  ) {
    // nothing here yet
  }

  private _createKeyed<FunctionName extends keyof AsyncValueCache<T>>(
    functionName: FunctionName,
  ): (key: K, ...args: Parameters<AsyncValueCache<T>[FunctionName]>) => ReturnType<AsyncValueCache<T>[FunctionName]> {
    return (key: K, ...args) => {
      const valueCache = this.getValueCache(key);
      return (valueCache[functionName] as any).apply(valueCache, args);
    };
  }

  getValueCache(key: K): AsyncValueCache<T> {
    let cache = this._map.get(key);
    if (!cache) {
      cache = new AsyncValueCache(async (isFirst) => {
        return await this._fetcher(key, isFirst);
      }, this._rateLimitOptions);
      this._map.set(key, cache);
    }
    return cache;
  }

  isAvailable = this._createKeyed("isAvailable");
  setUnavailable = this._createKeyed("setUnavailable");
  get = this._createKeyed("get");
  getOrWait = this._createKeyed("getOrWait");
  refresh = this._createKeyed("refresh");
  invalidate = this._createKeyed("invalidate");
  onChange = this._createKeyed("onChange");
  onceChange = this._createKeyed("onceChange");
}

export class AsyncValueCache<T> implements ReadonlyAsyncStore<T> {
  private _store: AsyncStore<T>;
  private _firstFetcher: () => Promise<T>;
  private _laterFetcher: () => Promise<T>;

  constructor(
    fetcher: (isFirst: boolean) => Promise<T>,
    private readonly _rateLimitOptions: Omit<RateLimitOptions, "batchCalls"> = { concurrency: 1, debounceMs: 3_000 },
  ) {
    this._store = new AsyncStore();

    this._firstFetcher = async () => {
      return await fetcher(true);
    };
    this._laterFetcher = rateLimited(async () => {
      return await fetcher(false);
    }, {
      ...this._rateLimitOptions,
      batchCalls: true,
    });

    this._refetch(true).catch(() => {
      this._store.setRejected(new Error("unavailable"));
    });
  }

  isAvailable(): boolean {
    return this._store.isAvailable();
  }

  setUnavailable(): void {
    this._store.setUnavailable();
  }

  get() {
    return this._store.get();
  }

  async getOrWait(): Promise<T> {
    return await this._store.getOrWait();
  }

  private _set(value: T): void {
    this._store.set(value);
  }

  private async _setAsync(value: Promise<T>): Promise<boolean> {
    return await this._store.setAsync(value);
  }

  private async _refetch(isFirst: boolean): Promise<T> {
    try {
      const res = isFirst ? this._firstFetcher() : this._laterFetcher();
      await this._setAsync(res);
      return await res;
    } catch (e) {
      this._store.setRejected(e);
      throw e;
    }
  }

  async refresh(): Promise<T> {
    return await this._refetch(false);
  }

  async invalidate(): Promise<T> {
    this.setUnavailable();
    return await this._refetch(false);
  }

  onChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void } {
    return this._store.onChange(callback);
  }

  onceChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void } {
    return this._store.onceChange(callback);
  }
}
