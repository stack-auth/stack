import crypto from "crypto";
import elliptic from "elliptic";
import * as jose from "jose";
import { JOSEError } from "jose/errors";
import { encodeBase64Url } from "./bytes";
import { getEnvVariable } from "./env";
import { globalVar } from "./globals";
import { pick } from "./objects";

const STACK_SERVER_SECRET = process.env.STACK_SERVER_SECRET ?? "";
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

export type PrivateJwk = {
  kty: "EC",
  alg: "ES256",
  crv: "P-256",
  kid: string,
  d: string,
  x: string,
  y: string,
};
export async function getPrivateJwk(secret: string): Promise<PrivateJwk> {
  const secretHash = await globalVar.crypto.subtle.digest("SHA-256", jose.base64url.decode(secret));
  const priv = new Uint8Array(secretHash);

  const ec = new elliptic.ec('p256');
  const key = ec.keyFromPrivate(priv);
  const publicKey = key.getPublic();

  return {
    kty: 'EC',
    crv: 'P-256',
    alg: 'ES256',
    kid: getKid({ secret }),
    d: encodeBase64Url(priv),
    x: encodeBase64Url(publicKey.getX().toBuffer()),
    y: encodeBase64Url(publicKey.getY().toBuffer()),
  };
}

export type PublicJwk = {
  kty: "EC",
  alg: "ES256",
  crv: "P-256",
  kid: string,
  x: string,
  y: string,
};
export async function getPublicJwkSet(secretOrPrivateJwk: string | PrivateJwk): Promise<{ keys: PublicJwk[] }> {
  const privateJwk = typeof secretOrPrivateJwk === "string" ? await getPrivateJwk(secretOrPrivateJwk) : secretOrPrivateJwk;
  const jwk = pick(privateJwk, ["kty", "alg", "crv", "x", "y", "kid"]);
  return {
    keys: [jwk],
  };
}

export function getPerAudienceSecret(options: {
  audience: string,
  secret: string,
}) {
  return jose.base64url.encode(
    crypto
      .createHash('sha256')
      // TODO we should prefix a string like "stack-audience-secret" before we hash so you can't use `getKid(...)` to get the secret for eg. the "kid" audience if the same secret value is used
      // Sadly doing this modification is a bit annoying as we need to leave the old keys to be valid for a little longer
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
      .update(JSON.stringify([options.secret, "kid"]))  // TODO see above in getPerAudienceSecret
      .digest()
  ).slice(0, 12);
}
