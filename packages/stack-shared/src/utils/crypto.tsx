import crypto from "node:crypto";

export function generateSecureRandomString(minBitsOfEntropy: number = 196) {
  const randomBytes = crypto.randomBytes(Math.ceil(minBitsOfEntropy / 8));
  return randomBytes.toString("hex");
}
