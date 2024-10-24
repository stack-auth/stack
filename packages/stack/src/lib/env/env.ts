import { unstable_noStore as noStore } from 'next/cache';
import { PUBLIC_ENV_KEY } from './public-env-script';

function isBrowser(): boolean {
  return Boolean(typeof window !== 'undefined' && window[PUBLIC_ENV_KEY as keyof typeof window]);
}

/**
 * Reads any NEXT_PUBLIC_ environment variable from the browser or any environment
 * variable from the server (process.env). Throws an error if trying to read a non-NEXT_PUBLIC_
 * environment variable in the browser.
 *
 * Usage:
 * ```ts
 * const API_URL = env('NEXT_PUBLIC_API_URL');
 * ```
 */
export function env(key: string): string | undefined {
  if (isBrowser()) {
    if (!key.startsWith('NEXT_PUBLIC_')) {
      throw new Error(
        `Environment variable '${key}' is not public and cannot be accessed in the browser.`,
      );
    }

    return window[PUBLIC_ENV_KEY as keyof typeof window][key];
  }

  noStore();

  return process.env[key];
}
