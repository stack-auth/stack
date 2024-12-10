import 'vitest';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface CustomMatchers<R = unknown> {
  toSatisfy: (predicate: (value: string) => boolean) => R,
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
