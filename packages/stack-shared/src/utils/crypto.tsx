import { encodeBase32 } from "./bytes";
import { globalVar } from "./globals";

/**
 * Generates a secure alphanumeric string using the system's cryptographically secure
 * random number generator.
 */
export function generateSecureRandomString(minBitsOfEntropy: number = 224) {
  const base32CharactersCount = Math.ceil(minBitsOfEntropy / 5);
  const bytesCount = Math.ceil(base32CharactersCount * 5 / 8);
  const randomBytes = globalVar.crypto.getRandomValues(new Uint8Array(bytesCount));
  const str = encodeBase32(randomBytes);
  return str.slice(str.length - base32CharactersCount).toLowerCase();
}
