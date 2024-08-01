import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// TODO next-release: remove
export function validateUrl(url, domains, allowLocalhost) {
    if (allowLocalhost && (new URL(url).hostname === "localhost" || new URL(url).hostname.match(/^127\.\d+\.\d+\.\d+$/))) {
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
