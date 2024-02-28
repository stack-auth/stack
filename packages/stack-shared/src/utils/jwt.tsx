import * as jose from "jose";
import { getEnvVariable } from "./env";

const SERVER_SECRET = jose.base64url.decode(getEnvVariable("SERVER_SECRET"));

export async function encryptJWT(payload: any, expirationTime = "5m") {
  return await new jose.EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .encrypt(SERVER_SECRET);
}

export async function decryptJWT(jwt: string) {
  if (!jwt) {
    throw new Error("Provided JWT is empty");
  }
  return (await jose.jwtDecrypt(jwt, SERVER_SECRET)).payload;
}
