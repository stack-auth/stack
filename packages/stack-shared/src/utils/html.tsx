import { templateIdentity } from "./strings";

export function escapeHtml(unsafe: string): string {
  return `${unsafe}`.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function html(strings: TemplateStringsArray, ...values: any[]): string {
  return templateIdentity(strings, ...values.map((v) => escapeHtml(`${v}`)));
}
