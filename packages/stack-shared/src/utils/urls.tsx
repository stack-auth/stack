import { generateSecureRandomString } from "./crypto";

export function createUrlIfValid(...args: ConstructorParameters<typeof URL>) {
  try {
    return new URL(...args);
  } catch (e) {
    return null;
  }
}

export function isLocalhost(urlOrString: string | URL) {
  const url = createUrlIfValid(urlOrString);
  if (!url) return false;
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return true;
  if (url.hostname.match(/^127\.\d+\.\d+\.\d+$/)) return true;
  return false;
}

export function isRelative(url: string) {
  const randomDomain = `${generateSecureRandomString()}.stack-auth.example.com`;
  const u = createUrlIfValid(url, `https://${randomDomain}`);
  if (!u) return false;
  if (u.host !== randomDomain) return false;
  if (u.protocol !== "https:") return false;
  return true;
}

export function getRelativePart(url: URL) {
  return url.pathname + url.search + url.hash;
}
