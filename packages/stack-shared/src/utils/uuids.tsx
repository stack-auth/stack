import { globalVar } from "./globals";

export function generateUuid() {
  return globalVar.crypto.randomUUID();
}
