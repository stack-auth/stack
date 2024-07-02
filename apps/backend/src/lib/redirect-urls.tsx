import { DomainConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";

export function validateRedirectUrl(urlOrString: string | URL, domains: DomainConfigJson[], allowLocalhost: boolean): boolean {
  const url = new URL(urlOrString);
  if (allowLocalhost && (url.hostname === "localhost" || url.hostname.match(/^127\.\d+\.\d+\.\d+$/))) {
    return true;
  }
  return domains.some((domain) => {
    const testUrl = url;
    const baseUrl = new URL(domain.handlerPath, domain.domain);

    const sameOrigin = baseUrl.protocol === testUrl.protocol && baseUrl.hostname === testUrl.hostname;
    const isSubPath = testUrl.pathname.startsWith(baseUrl.pathname);

    return sameOrigin && isSubPath;
  });
}
