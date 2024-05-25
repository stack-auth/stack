import { EditorBlockSchema, TEditorConfiguration } from "@/components/email-editor/documents/editor/core";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DomainConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateEmailTemplateContent(content: any): content is TEditorConfiguration {
  try {
    for (const key of Object.keys(content)) {
      const block = content[key];
      EditorBlockSchema.parse(block);
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function validateUrl(url: string, domains: DomainConfigJson[], allowLocalhost: boolean): boolean {
  if (allowLocalhost && (new URL(url).hostname === "localhost" || new URL(url).hostname === "127.0.0.1")) {
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
