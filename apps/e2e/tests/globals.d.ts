import 'vitest';

interface CustomMatchers<R = unknown> {
  toSatisfy: (predicate: (value: string) => boolean) => R,
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
