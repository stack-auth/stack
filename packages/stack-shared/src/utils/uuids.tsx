export function generateUuid() {
  return globalThis.crypto.randomUUID();
}
