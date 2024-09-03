import { encodeBase32 } from "./bytes";
import { StackAssertionError } from "./errors";
import { globalVar } from "./globals";

export function generateRandomValues(array: Uint8Array): typeof array {
  if (!globalVar.crypto) {
    throw new StackAssertionError("Crypto API is not available in this environment. Are you using an old browser?");
  }
  if (!globalVar.crypto.getRandomValues) {
    throw new StackAssertionError("crypto.getRandomValues is not available in this environment. Are you using an old browser?");
  }
  return globalVar.crypto.getRandomValues(array);
}

/**
 * Generates a secure alphanumeric string using the system's cryptographically secure
 * random number generator.
 */
export function generateSecureRandomString(minBitsOfEntropy: number = 224) {
  const base32CharactersCount = Math.ceil(minBitsOfEntropy / 5);
  const bytesCount = Math.ceil((base32CharactersCount * 5) / 8);
  const randomBytes = generateRandomValues(new Uint8Array(bytesCount));
  const str = encodeBase32(randomBytes);
  return str.slice(str.length - base32CharactersCount).toLowerCase();
}
