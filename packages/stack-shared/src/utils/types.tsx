export type IsAny<T> = 0 extends (1 & T) ? true : false;
export type isNullish<T> = T extends null | undefined ? true : false;

export type NullishCoalesce<T, U> = T extends null | undefined ? U : T;
