export function identity<T>(t: T): T {
  return t;
}

export function identityArgs<T extends any[]>(...args: T): T {
  return args;
}
