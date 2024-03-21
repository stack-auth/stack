export function isClient() {
  // TODO improve function name (could be confused because this may return false in client components during SSR)
  return typeof window !== "undefined";
}
