import { throwErr } from "./errors";
import { deindent } from "./strings";

export function isBrowserLike() {
  return typeof window !== "undefined" && typeof document !== "undefined" && typeof document.createElement !== "undefined";
}

/**
 * Returns the environment variable with the given name, throwing an error if it's undefined or the empty string.
 */
export function getEnvVariable(name: string): string {
  if (isBrowserLike()) {
    throw new Error(deindent`
      Can't use getEnvVariable on the client because Next.js transpiles expressions of the kind process.env.XYZ at build-time on the client.
    
      Use process.env.XYZ directly instead.
    `);
  }

  return (process.env[name] ?? throwErr(`Missing environment variable: ${name}`)) || throwErr(`Empty environment variable: ${name}`);
}
