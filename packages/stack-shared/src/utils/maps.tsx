import { Result } from "./results";

export class MaybeWeakMap<K, V> {
  private readonly _primitiveMap: Map<K, V>;
  private readonly _weakMap: WeakMap<K & WeakKey, V>;

  constructor(entries?: readonly (readonly [K, V])[] | null) {
    const entriesArray = [...(entries ?? [])];
    this._primitiveMap = new Map(entriesArray.filter((e) => !this._isAllowedInWeakMap(e[0])));
    this._weakMap = new WeakMap(entriesArray.filter((e): e is [K & WeakKey, V] => this._isAllowedInWeakMap(e[0])));
  }

  private _isAllowedInWeakMap(key: K): key is K & WeakKey {
    return (typeof key === "object" && key !== null) || (typeof key === "symbol" && Symbol.keyFor(key) === undefined);
  }

  get(key: K): V | undefined {
    if (this._isAllowedInWeakMap(key)) {
      return this._weakMap.get(key);
    } else {
      return this._primitiveMap.get(key);
    }
  }

  set(key: K, value: V): this {
    if (this._isAllowedInWeakMap(key)) {
      this._weakMap.set(key, value);
    } else {
      this._primitiveMap.set(key, value);
    }
    return this;
  }

  delete(key: K): boolean {
    if (this._isAllowedInWeakMap(key)) {
      return this._weakMap.delete(key);
    } else {
      return this._primitiveMap.delete(key);
    }
  }

  has(key: K): boolean {
    if (this._isAllowedInWeakMap(key)) {
      return this._weakMap.has(key);
    } else {
      return this._primitiveMap.has(key);
    }
  }

  [Symbol.toStringTag] = "MaybeWeakMap";
}

type DependenciesMapInner<V> = { map: MaybeWeakMap<unknown, DependenciesMapInner<V>> } & (
  | { hasValue: true; value: V }
  | { hasValue: false; value: undefined }
);

export class DependenciesMap<K extends any[], V> {
  private _inner: DependenciesMapInner<V> = { map: new MaybeWeakMap(), hasValue: false, value: undefined };

  private _valueToResult(inner: DependenciesMapInner<V>): Result<V, void> {
    if (inner.hasValue) {
      return Result.ok(inner.value);
    } else {
      return Result.error(undefined);
    }
  }

  private _unwrapFromInner(dependencies: any[], inner: DependenciesMapInner<V>): Result<V, void> {
    if (dependencies.length === 0) {
      return this._valueToResult(inner);
    } else {
      const [key, ...rest] = dependencies;
      const newInner = inner.map.get(key);
      if (!newInner) {
        return Result.error(undefined);
      }
      return this._unwrapFromInner(rest, newInner);
    }
  }

  private _setInInner(dependencies: any[], value: Result<V, void>, inner: DependenciesMapInner<V>): Result<V, void> {
    if (dependencies.length === 0) {
      const res = this._valueToResult(inner);
      if (value.status === "ok") {
        inner.hasValue = true;
        inner.value = value.data;
      } else {
        inner.hasValue = false;
        inner.value = undefined;
      }
      return res;
    } else {
      const [key, ...rest] = dependencies;
      let newInner = inner.map.get(key);
      if (!newInner) {
        inner.map.set(key, (newInner = { map: new MaybeWeakMap(), hasValue: false, value: undefined }));
      }
      return this._setInInner(rest, value, newInner);
    }
  }

  get(dependencies: K): V | undefined {
    return Result.or(this._unwrapFromInner(dependencies, this._inner), undefined);
  }

  set(dependencies: K, value: V): this {
    this._setInInner(dependencies, Result.ok(value), this._inner);
    return this;
  }

  delete(dependencies: K): boolean {
    return this._setInInner(dependencies, Result.error(undefined), this._inner).status === "ok";
  }

  has(dependencies: K): boolean {
    return this._unwrapFromInner(dependencies, this._inner).status === "ok";
  }

  clear(): void {
    this._inner = { map: new MaybeWeakMap(), hasValue: false, value: undefined };
  }

  [Symbol.toStringTag] = "DependenciesMap";
}
