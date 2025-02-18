import { throwErr } from "./errors";
import { deindent } from "./strings";

export function isBrowserLike() {
  return typeof window !== "undefined" && typeof document !== "undefined" && typeof document.createElement !== "undefined";
}

// newName: oldName
const ENV_VAR_RENAME: Record<string, string[]> = {
  NEXT_PUBLIC_STACK_API_URL: ['STACK_BASE_URL', 'NEXT_PUBLIC_STACK_URL'],
};

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
  if (name === "NEXT_RUNTIME") {
    throw new Error(deindent`
      Can't use getEnvVariable to access the NEXT_RUNTIME environment variable because it's compiled into the client bundle.
    
      Use getNextRuntime() instead.
    `);
  }

  // throw error if the old name is used as the retrieve key
  for (const [newName, oldNames] of Object.entries(ENV_VAR_RENAME)) {
    if (oldNames.includes(name)) {
      throwErr(`Environment variable ${name} has been renamed to ${newName}. Please update your configuration to use the new name.`);
    }
  }

  let value = process.env[name];

  // check the key under the old name if the new name is not found
  if (!value && ENV_VAR_RENAME[name] as any) {
    for (const oldName of ENV_VAR_RENAME[name]) {
      value = process.env[oldName];
      if (value) break;
    }
  }

  if (value === undefined) {
    if (defaultValue !== undefined) {
      value = defaultValue;
    } else {
      throwErr(`Missing environment variable: ${name}`);
    }
  }

  return value;
}

export function getNextRuntime() {
  // This variable is compiled into the client bundle, so we can't use getEnvVariable here.
  return process.env.NEXT_RUNTIME || throwErr("Missing environment variable: NEXT_RUNTIME");
}

export function getNodeEnvironment() {
  return getEnvVariable("NODE_ENV", "");
}

// ===================== Hack to use dynamic env vars in docker build =====================

// This is a hack to use the env vars in vite/browser environments
if (typeof process === "undefined") {
  (globalThis as any).process = { env: {} };
}

const _inlineEnvVars = {
  NEXT_PUBLIC_STACK_API_URL: process.env.NEXT_PUBLIC_STACK_API_URL,
  NEXT_PUBLIC_BROWSER_STACK_API_URL: process.env.NEXT_PUBLIC_BROWSER_STACK_API_URL,
  NEXT_PUBLIC_SERVER_STACK_API_URL: process.env.NEXT_PUBLIC_SERVER_STACK_API_URL,
  NEXT_PUBLIC_STACK_DASHBOARD_URL: process.env.NEXT_PUBLIC_STACK_DASHBOARD_URL,
  NEXT_PUBLIC_BROWSER_STACK_DASHBOARD_URL: process.env.NEXT_PUBLIC_BROWSER_STACK_DASHBOARD_URL,
  NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL: process.env.NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_STACK_SVIX_SERVER_URL: process.env.NEXT_PUBLIC_STACK_SVIX_SERVER_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY: process.env.NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY,
  NEXT_PUBLIC_STACK_EMULATOR_ENABLED: process.env.NEXT_PUBLIC_STACK_EMULATOR_ENABLED,
  NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID,
  NEXT_PUBLIC_STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  NEXT_PUBLIC_STACK_URL: process.env.NEXT_PUBLIC_STACK_URL,
  NEXT_PUBLIC_STACK_INBUCKET_WEB_URL: process.env.NEXT_PUBLIC_STACK_INBUCKET_WEB_URL,
} as const;

// This will be replaced with the actual env vars after a docker build
const _postBuildEnvVars = {
  NEXT_PUBLIC_STACK_API_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_API_URL",
  NEXT_PUBLIC_BROWSER_STACK_API_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_BROWSER_STACK_API_URL",
  NEXT_PUBLIC_SERVER_STACK_API_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SERVER_STACK_API_URL",
  NEXT_PUBLIC_STACK_DASHBOARD_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_DASHBOARD_URL",
  NEXT_PUBLIC_BROWSER_STACK_DASHBOARD_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_BROWSER_STACK_DASHBOARD_URL",
  NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL",
  NEXT_PUBLIC_STACK_PROJECT_ID: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_PROJECT_ID",
  NEXT_PUBLIC_POSTHOG_KEY: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_POSTHOG_KEY",
  NEXT_PUBLIC_STACK_SVIX_SERVER_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_SVIX_SERVER_URL",
  NEXT_PUBLIC_SENTRY_DSN: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SENTRY_DSN",
  NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY",
  NEXT_PUBLIC_STACK_EMULATOR_ENABLED: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_EMULATOR_ENABLED",
  NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID",
  NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  NEXT_PUBLIC_STACK_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_URL",
  NEXT_PUBLIC_STACK_INBUCKET_WEB_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_INBUCKET_WEB_URL",
} satisfies typeof _inlineEnvVars;

// If this is not replaced with "true", then we will not use inline env vars
const _usePostBuildEnvVars = 'STACK_ENV_VAR_SENTINEL_USE_INLINE_ENV_VARS';

export function getPublicEnvVar(name: keyof typeof _inlineEnvVars) {
  // This is a hack to force the compiler not to do any smart optimizations
  const _ = _usePostBuildEnvVars.toString() + _inlineEnvVars.toString(); // Force runtime evaluation

  const value = _usePostBuildEnvVars.slice(0) === 'true' ? _postBuildEnvVars[name] : _inlineEnvVars[name];

  if (_usePostBuildEnvVars.slice(0) === 'true' && value && value.startsWith('STACK_ENV_VAR_SENTINEL')) {
    return undefined;
  }
  return value;
}

// ======================================================================
