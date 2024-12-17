declare module 'remark-heading-id';

declare namespace React {
  // inert doesn't exist in React.HTMLAttributes, so we need to extend it
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface HTMLAttributes<T> {
    inert?: '',
  }
}
