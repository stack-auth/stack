import { generateSecureRandomString } from "./crypto";
import { templateIdentity } from "./strings";

export function createUrlIfValid(...args: ConstructorParameters<typeof URL>) {
  try {
    return new URL(...args);
  } catch (e) {
    return null;
  }
}

export function isValidUrl(url: string) {
  return !!createUrlIfValid(url);
}

export function isValidHostname(hostname: string) {
  const url = createUrlIfValid(`https://${hostname}`);
  if (!url) return false;
  return url.hostname === hostname;
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

/**
 * A template literal tag that returns a URL.
 *
 * Any values passed are encoded.
 */
export function url(strings: TemplateStringsArray | readonly string[], ...values: (string|number|boolean)[]): URL {
  return new URL(urlString(strings, ...values));

}


/**
 * A template literal tag that returns a URL string.
 *
 * Any values passed are encoded.
 */
export function urlString(strings: TemplateStringsArray | readonly string[], ...values: (string|number|boolean)[]): string {
  return templateIdentity(strings, ...values.map(encodeURIComponent));
}


