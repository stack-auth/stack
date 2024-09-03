/* eslint-disable @typescript-eslint/no-empty-object-type */
import { StackAssertionError } from "./errors";
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from "./strings";

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Assumes both objects are primitives, arrays, or non-function plain objects, and compares them deeply.
 *
 * Note that since they are assumed to be plain objects, this function does not compare prototypes.
 */
export function deepPlainEquals<T>(obj1: T, obj2: unknown, options: { ignoreUndefinedValues?: boolean } = {}): obj2 is T {
  if (typeof obj1 !== typeof obj2) return false;
  if (obj1 === obj2) return true;

  switch (typeof obj1) {
    case "object": {
      if (!obj1 || !obj2) return false;

      if (Array.isArray(obj1) || Array.isArray(obj2)) {
        if (!Array.isArray(obj1) || !Array.isArray(obj2)) return false;
        if (obj1.length !== obj2.length) return false;
        return obj1.every((v, i) => deepPlainEquals(v, obj2[i], options));
      }

      const entries1 = Object.entries(obj1).filter(([, v]) => !options.ignoreUndefinedValues || v !== undefined);
      const entries2 = Object.entries(obj2).filter(([, v]) => !options.ignoreUndefinedValues || v !== undefined);
      if (entries1.length !== entries2.length) return false;
      return entries1.every(([k, v1]) => {
        const e2 = entries2.find(([k2]) => k === k2);
        if (!e2) return false;
        return deepPlainEquals(v1, e2[1], options);
      });
    }
    case "undefined":
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
    case "function": {
      return false;
    }
    default: {
      throw new Error("Unexpected typeof " + typeof obj1);
    }
  }
}

export function deepPlainClone<T>(obj: T): T {
  if (typeof obj === "function") throw new StackAssertionError("deepPlainClone does not support functions");
  if (typeof obj === "symbol") throw new StackAssertionError("deepPlainClone does not support symbols");
  if (typeof obj !== "object" || !obj) return obj;
  if (Array.isArray(obj)) return obj.map(deepPlainClone) as any;
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepPlainClone(v)])) as any;
}

export function deepPlainSnakeCaseToCamelCase(snakeCaseObj: any): any {
  if (typeof snakeCaseObj === "function") throw new StackAssertionError("deepPlainSnakeCaseToCamelCase does not support functions");
  if (typeof snakeCaseObj !== "object" || !snakeCaseObj) return snakeCaseObj;
  if (Array.isArray(snakeCaseObj)) return snakeCaseObj.map((o) => deepPlainSnakeCaseToCamelCase(o));
  return Object.fromEntries(Object.entries(snakeCaseObj).map(([k, v]) => [snakeCaseToCamelCase(k), deepPlainSnakeCaseToCamelCase(v)]));
}

export function deepPlainCamelCaseToSnakeCase(camelCaseObj: any): any {
  if (typeof camelCaseObj === "function") throw new StackAssertionError("deepPlainCamelCaseToSnakeCase does not support functions");
  if (typeof camelCaseObj !== "object" || !camelCaseObj) return camelCaseObj;
  if (Array.isArray(camelCaseObj)) return camelCaseObj.map((o) => deepPlainCamelCaseToSnakeCase(o));
  return Object.fromEntries(Object.entries(camelCaseObj).map(([k, v]) => [camelCaseToSnakeCase(k), deepPlainCamelCaseToSnakeCase(v)]));
}

export function typedEntries<T extends {}>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as any;
}

export function typedFromEntries<K extends PropertyKey, V>(entries: [K, V][]): Record<K, V> {
  return Object.fromEntries(entries) as any;
}

export function typedKeys<T extends {}>(obj: T): (keyof T)[] {
  return Object.keys(obj) as any;
}

export function typedValues<T extends {}>(obj: T): T[keyof T][] {
  return Object.values(obj) as any;
}

export function typedAssign<T extends {}, U extends {}>(target: T, source: U): T & U {
  return Object.assign(target, source);
}

export type FilterUndefined<T> = {
  [k in keyof T as undefined extends T[k] ? (T[k] extends undefined | void ? never : k) : never]+?: T[k] & ({} | null);
} & { [k in keyof T as undefined extends T[k] ? never : k]: T[k] & ({} | null) };

/**
 * Returns a new object with all undefined values removed. Useful when spreading optional parameters on an object, as
 * TypeScript's `Partial<XYZ>` type allows `undefined` values.
 */
export function filterUndefined<T extends {}>(obj: T): FilterUndefined<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as any;
}

export function pick<T extends {}, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k as K))) as any;
}

export function omit<T extends {}, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as K))) as any;
}

export function split<T extends {}, K extends keyof T>(obj: T, keys: K[]): [Pick<T, K>, Omit<T, K>] {
  return [pick(obj, keys), omit(obj, keys)];
}
