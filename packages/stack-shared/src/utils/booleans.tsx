export type Truthy<T> = T extends null | undefined | 0 | "" | false ? false : true;
export type Falsy<T> = T extends null | undefined | 0 | "" | false ? true : false;

export function isTruthy<T>(value: T): value is T & Truthy<T> {
  return !!value;
}

export function isFalsy<T>(value: T): value is T & Falsy<T> {
  return !value;
}
