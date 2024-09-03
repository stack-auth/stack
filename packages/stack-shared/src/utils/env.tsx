import { throwErr } from "./errors";
import { deindent } from "./strings";

export function isBrowserLike() {
  return typeof window !== "undefined" && typeof document !== "undefined" && typeof document.createElement !== "undefined";
}

/**
 * Returns the environment variable with the given name, returning the default (if given) or throwing an error (otherwise) if it's undefined or the empty string.
 */
export function getEnvVariable(name: string, defaultValue?: string | undefined): string {
  if (isBrowserLike()) {
    throw new Error(deindent`
      Can't use getEnvVariable on the client because Next.js transpiles expressions of the kind process.env.XYZ at build-time on the client.
    
      Use process.env.XYZ directly instead.
    `);
  }

  return (
    ((process.env[name] || defaultValue) ?? throwErr(`Missing environment variable: ${name}`)) ||
    (defaultValue ?? throwErr(`Empty environment variable: ${name}`))
  );
}

export function getNodeEnvironment() {
  return getEnvVariable("NODE_ENV", "");
}
