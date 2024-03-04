import { DomainConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";

export function validateUrl(url: string, domains: DomainConfigJson[], allowLocalhost: boolean): boolean {
  if (allowLocalhost && new URL(url).hostname === "localhost") {
    return true;
  }
  return domains.some((domain) => {
    const testUrl = new URL(url);
    const baseUrl = new URL(domain.handlerPath, domain.domain);

    const sameOrigin = baseUrl.protocol === testUrl.protocol && baseUrl.hostname === testUrl.hostname;
    const isSubPath = testUrl.pathname.startsWith(baseUrl.pathname);

    return sameOrigin && isSubPath;
  });
}
