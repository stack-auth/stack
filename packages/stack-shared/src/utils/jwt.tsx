import * as jose from "jose";
import { getEnvVariable } from "./env";

const STACK_SERVER_SECRET = jose.base64url.decode(getEnvVariable("STACK_SERVER_SECRET"));

export async function encryptJWT(payload: any, expirationTime = "5m") {
  return await new jose.EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .encrypt(STACK_SERVER_SECRET);
}

export async function decryptJWT(jwt: string) {
  if (!jwt) {
    throw new Error("Provided JWT is empty");
  }
  return (await jose.jwtDecrypt(jwt, STACK_SERVER_SECRET)).payload;
}
