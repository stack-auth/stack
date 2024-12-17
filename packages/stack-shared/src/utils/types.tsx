export type IsAny<T> = 0 extends (1 & T) ? true : false;
export type isNullish<T> = T extends null | undefined ? true : false;

export type NullishCoalesce<T, U> = T extends null | undefined ? U : T;

// distributive conditional type magic. See: https://stackoverflow.com/a/50375286
export type UnionToIntersection<U> =
  (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never

export type OR<A, B> = A extends true ? true : (B extends true ? true : false)
export type AND<A, B> = A extends true ? (B extends true ? true : false) : false;
