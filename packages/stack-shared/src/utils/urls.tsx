import { generateSecureRandomString } from "./crypto";

export function isLocalhost(urlOrString: string | URL) {
  const url = new URL(urlOrString);
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return true;
  if (url.hostname.match(/^127\.\d+\.\d+\.\d+$/)) return true;
  return false;
}

export function isRelative(url: string) {
  const randomDomain = `${generateSecureRandomString()}.stack-auth.example.com`;
  const u = new URL(url, `https://${randomDomain}`);
  if (u.host !== randomDomain) return false;
  if (u.protocol !== "https:") return false;
  return true;
}

export function getRelativePart(url: URL) {
  return url.pathname + url.search + url.hash;
}
