import crypto from "node:crypto";
import { encodeBase32 } from "./bytes";

export function generateSecureRandomString(minBitsOfEntropy: number = 224) {
  const base32CharactersCount = Math.ceil(minBitsOfEntropy / 5);
  const bytesCount = Math.ceil(base32CharactersCount * 5 / 8);
  const randomBytes = crypto.randomBytes(bytesCount);
  const str = encodeBase32(randomBytes);
  return str.slice(str.length - base32CharactersCount).toLowerCase();
}
