import { globalVar } from "./globals";

export function generateUuid() {
  // crypto.randomUuid is not supported in all browsers, so this is a polyfill
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ globalVar.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}
