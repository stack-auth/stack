export type ReadonlyJson =
  | null
  | boolean
  | number
  | string
  | readonly ReadonlyJson[]
  | { readonly [key: string]: ReadonlyJson };