import elliptic from "elliptic";
import * as jose from "jose";
import { encodeBase64 } from "./bytes";
import { getEnvVariable } from "./env";
import { globalVar } from "./globals";
import { pick } from "./objects";

const STACK_SERVER_SECRET = jose.base64url.decode(getEnvVariable("STACK_SERVER_SECRET"));

export async function signJWT(issuer: string, payload: any, expirationTime = "5m") {
  const privateJwk = await jose.importJWK(await getPrivateJwk());
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "ES256" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(privateJwk);
}

export async function verifyJWT(issuer: string, jwt: string) {
  const jwkSet = jose.createLocalJWKSet(await getPublicJwkSet());
  const verified = await jose.jwtVerify(jwt, jwkSet, {
    issuer,
  });
  return verified.payload;
}

export async function getPrivateJwk() {
  const secretHash = await globalVar.crypto.subtle.digest("SHA-256", STACK_SERVER_SECRET);
  const priv = new Uint8Array(secretHash);

  const ec = new elliptic.ec('p256');
  const key = ec.keyFromPrivate(priv);
  const publicKey = key.getPublic();

  return {
    kty: 'EC',
    crv: 'P-256',
    d: encodeBase64(priv),
    x: encodeBase64(publicKey.getX().toBuffer()),
    y: encodeBase64(publicKey.getY().toBuffer()),
  };
}

export async function getPublicJwkSet() {
  const privateJwk = await getPrivateJwk();
  const jwk = pick(privateJwk, ["kty", "crv", "x", "y"]);
  return {
    keys: [jwk]
  };
}

export async function encryptJWE(payload: any, expirationTime = "5m") {
  return await new jose.EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
    .setIssuer("stack")
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .encrypt(STACK_SERVER_SECRET);
}

export async function decryptJWE(jwt: string) {
  if (!jwt) {
    throw new Error("Provided JWT is empty");
  }
  return (await jose.jwtDecrypt(jwt, STACK_SERVER_SECRET)).payload;
}
