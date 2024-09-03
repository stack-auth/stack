import { Result } from "./results";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type ReadonlyJson = null | boolean | number | string | readonly ReadonlyJson[] | { readonly [key: string]: ReadonlyJson };

export function isJson(value: unknown): value is Json {
  switch (typeof value) {
    case "object": {
      if (value === null) return true;
      if (Array.isArray(value)) return value.every(isJson);
      return Object.keys(value).every((k) => typeof k === "string") && Object.values(value).every(isJson);
    }
    case "string":
    case "number":
    case "boolean": {
      return true;
    }
    default: {
      return false;
    }
  }
}

export function parseJson(json: string): Result<Json> {
  return Result.fromThrowing(() => JSON.parse(json));
}

export function stringifyJson(json: Json): Result<string> {
  return Result.fromThrowing(() => JSON.stringify(json));
}
