export async function neverResolve() {
  return await new Promise<never>(() => {});
}