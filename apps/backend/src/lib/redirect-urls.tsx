import { isLocalhost } from "@stackframe/stack-shared/dist/utils/urls";

export function validateRedirectUrl(
  urlOrString: string | URL,
  domains: { domain: string; handler_path: string }[],
  allowLocalhost: boolean,
): boolean {
  const url = new URL(urlOrString);
  if (allowLocalhost && isLocalhost(url)) {
    return true;
  }
  return domains.some((domain) => {
    const testUrl = url;
    const baseUrl = new URL(domain.domain);

    const sameOrigin = baseUrl.protocol === testUrl.protocol && baseUrl.hostname === testUrl.hostname;
    const isSubPath = testUrl.pathname.startsWith(baseUrl.pathname);

    return sameOrigin && isSubPath;
  });
}
