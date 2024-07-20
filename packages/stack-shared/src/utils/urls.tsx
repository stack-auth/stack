export function isLocalhost(urlOrString: string | URL) {
  const url = new URL(urlOrString);
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return true;
  if (url.hostname.match(/^127\.\d+\.\d+\.\d+$/)) return true;
  return false;
}