import elliptic from "elliptic";
import * as jose from "jose";
import { encodeBase64, encodeBase64Url } from "./bytes";
import { getEnvVariable } from "./env";
import { globalVar } from "./globals";
import { pick } from "./objects";
import crypto from "crypto";
import { JOSEError } from "jose/errors";

const STACK_SERVER_SECRET = getEnvVariable("STACK_SERVER_SECRET");
try {
  jose.base64url.decode(STACK_SERVER_SECRET);
} catch (e) {
  throw new Error("STACK_SERVER_SECRET is not valid. Please use the generateKeys script to generate a new secret.");
}

// TODO: remove this after moving everyone to project specific JWTs
export async function legacySignGlobalJWT(issuer: string, payload: any, expirationTime = "5m") {
  const privateJwk = await jose.importJWK(await getPrivateJwk(STACK_SERVER_SECRET));
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "ES256" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(privateJwk);
}

// TODO: remove this after moving everyone to project specific JWTs
export async function legacyVerifyGlobalJWT(issuer: string, jwt: string) {
  const jwkSet = jose.createLocalJWKSet(await getPublicJwkSet(STACK_SERVER_SECRET));
  const verified = await jose.jwtVerify(jwt, jwkSet, { issuer });
  return verified.payload;
}

export async function signJWT(options: {
  issuer: string,
  audience: string,
  payload: any,
  expirationTime?: string,
}) {
  const secret = getPerAudienceSecret({ audience: options.audience, secret: STACK_SERVER_SECRET });
  const kid = getKid({ secret });
  const privateJwk = await jose.importJWK(await getPrivateJwk(secret));
  return await new jose.SignJWT(options.payload)
    .setProtectedHeader({ alg: "ES256", kid })
    .setIssuer(options.issuer)
    .setIssuedAt()
    .setAudience(options.audience)
    .setExpirationTime(options.expirationTime || "5m")
    .sign(privateJwk);
}

export async function verifyJWT(options: {
  issuer: string,
  jwt: string,
}) {
  const audience = jose.decodeJwt(options.jwt).aud;
  if (!audience || typeof audience !== "string") {
    throw new JOSEError("Invalid JWT audience");
  }
  const secret = getPerAudienceSecret({ audience, secret: STACK_SERVER_SECRET });
  const jwkSet = jose.createLocalJWKSet(await getPublicJwkSet(secret));
  const verified = await jose.jwtVerify(options.jwt, jwkSet, { issuer: options.issuer });
  return verified.payload;
}

export async function getPrivateJwk(secret: string) {
  const secretHash = await globalVar.crypto.subtle.digest("SHA-256", jose.base64url.decode(secret));
  const priv = new Uint8Array(secretHash);

  const ec = new elliptic.ec('p256');
  const key = ec.keyFromPrivate(priv);
  const publicKey = key.getPublic();

  return {
    kty: 'EC',
    crv: 'P-256',
    d: encodeBase64Url(priv),
    x: encodeBase64Url(publicKey.getX().toBuffer()),
    y: encodeBase64Url(publicKey.getY().toBuffer()),
  };
}

export async function getPublicJwkSet(secret: string) {
  const privateJwk = await getPrivateJwk(secret);
  const jwk = pick(privateJwk, ["kty", "crv", "x", "y"]);
  return {
    keys: [{ ...jwk, kid: getKid({ secret }) }],
  };
}

export function getPerAudienceSecret(options: {
  audience: string,
  secret: string,
}) {
  return jose.base64url.encode(
    crypto
      .createHash('sha256')
      .update(JSON.stringify([options.secret, options.audience]))
      .digest()
  );
};

export function getKid(options: {
  secret: string,
}) {
  return jose.base64url.encode(
    crypto
      .createHash('sha256')
      .update(JSON.stringify([options.secret, "kid"]))
      .digest()
  ).slice(0, 12);
}
