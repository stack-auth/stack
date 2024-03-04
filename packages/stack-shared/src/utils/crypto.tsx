import crypto from "node:crypto";
import { encodeBase32 } from "./bytes";

const characters = "23456789abcdefghjkmnopqrstuvwxyz";
if (characters.length !== 32) throw new Error("Invalid characters length");

export function generateSecureRandomString(minBitsOfEntropy: number = 224) {
  const randomBytes = crypto.randomBytes(Math.ceil(minBitsOfEntropy / 8));
  return encodeBase32(randomBytes).toLowerCase();
}
