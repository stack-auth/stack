import * as crypto from "crypto";
import { AsyncResult } from "./results";
import { generateUuid } from "./uuids";

export type ReadonlyAsyncStore<T> = {
  isAvailable(): boolean,
  get(): AsyncResult<T, unknown, void>,
  getOrWait(): Promise<T>,
  onChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void },
  onceChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void },
};

export class AsyncStore<T> implements ReadonlyAsyncStore<T> {
  private _isAvailable: boolean;
  private _value: T | undefined = undefined;

  private _isRejected = false;
  private _rejectionError: unknown;
  private readonly _waitingRejectFunctions = new Map<string, ((error: unknown) => void)>();

  private readonly _callbacks: Map<string, ((value: T, oldValue: T | undefined) => void)> = new Map();

  private _updateCounter = 0;
  private _lastSuccessfulUpdate = -1;

  constructor(...args: [] | [T]) {
    if (args.length === 0) {
      this._isAvailable = false;
    } else {
      this._isAvailable = true;
      this._value = args[0];
    }
  }

  isAvailable(): boolean {
    return this._isAvailable;
  }

  isRejected(): boolean {
    return this._isRejected;
  }

  get() {
    if (this.isRejected()) {
      return AsyncResult.error(this._rejectionError);
    } else if (this.isAvailable()) {
      return AsyncResult.ok(this._value as T);
    } else {
      return AsyncResult.pending();
    }
  }

  async getOrWait(): Promise<T> {
    const uuid = generateUuid();
    const promise = new Promise<T>((resolve, reject) => {
      if (this.isRejected()) {
        reject();
      } else if (this.isAvailable()) {
        resolve(this._value as T);
      } else {
        this.onceChange((value) => {
          resolve(value);
        });
        this._waitingRejectFunctions.set(uuid, reject);
      }
    });
    return await promise.finally(() => {
      this._waitingRejectFunctions.delete(uuid);
    });
  }

  _setIfLatest(value: T, curCounter: number) {
    if (!this._isAvailable || this._isRejected || this._value !== value) {
      const oldValue = this._value;
      if (curCounter > this._lastSuccessfulUpdate) {
        this._lastSuccessfulUpdate = curCounter;
        this._isAvailable = true;
        this._isRejected = false;
        this._value = value;
        this._callbacks.forEach((callback) => callback(value, oldValue));
        return true;
      }
      return false;
    }
    return false;
  }

  set(value: T): void {
    this._setIfLatest(value, ++this._updateCounter);
  }

  update(updater: (value: T | undefined) => T): T {
    const value = updater(this._value);
    this.set(value);
    return value;
  }

  async setAsync(promise: Promise<T>): Promise<boolean> {
    const curCounter = ++this._updateCounter;
    const value = await promise;
    return this._setIfLatest(value, curCounter);
  }

  setUnavailable(): void {
    this._isAvailable = false;
    this._isRejected = false;
    this._value = undefined;
  }

  setRejected(error: unknown): void {
    this._isRejected = true;
    this._value = undefined;
    this._rejectionError = error;
    this._waitingRejectFunctions.forEach((reject) => reject(error));
  }

  map<U>(mapper: (value: T) => U): AsyncStore<U> {
    const store = new AsyncStore<U>();
    this.onChange((value) => {
      store.set(mapper(value));
    });
    return store;
  }

  onChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void } {
    const uuid = generateUuid();
    this._callbacks.set(uuid, callback);
    return {
      unsubscribe: () => {
        this._callbacks.delete(uuid);
      },
    };
  }

  onceChange(callback: (value: T, oldValue: T | undefined) => void): { unsubscribe: () => void } {
    const { unsubscribe } = this.onChange((...args) => {
      unsubscribe();
      callback(...args);
    });
    return { unsubscribe };
  }
}
