import crypto from "node:crypto";
import { encodeBase32 } from "./bytes";

export function generateSecureRandomString(minBitsOfEntropy: number = 224) {
  const randomBytes = crypto.randomBytes(Math.ceil(minBitsOfEntropy / 8));
  return encodeBase32(randomBytes).toLowerCase();
}
