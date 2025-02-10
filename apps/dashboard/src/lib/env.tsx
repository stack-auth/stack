/* eslint-disable no-restricted-syntax */

import { isBrowserLike } from "@stackframe/stack-shared/dist/utils/env";

const _inlineEnvVars = {
  NEXT_PUBLIC_STACK_API_URL: {
    'default': process.env.NEXT_PUBLIC_STACK_API_URL,
    'client': process.env.NEXT_PUBLIC_CLIENT_STACK_API_URL,
    'server': process.env.NEXT_PUBLIC_SERVER_STACK_API_URL,
  },
  NEXT_PUBLIC_STACK_DASHBOARD_URL: {
    'default': process.env.NEXT_PUBLIC_STACK_DASHBOARD_URL,
    'client': process.env.NEXT_PUBLIC_CLIENT_STACK_DASHBOARD_URL,
    'server': process.env.NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL,
  },
  NEXT_PUBLIC_STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_STACK_SVIX_SERVER_URL: process.env.NEXT_PUBLIC_STACK_SVIX_SERVER_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY: process.env.NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY,
  NEXT_PUBLIC_STACK_EMULATOR_ENABLED: process.env.NEXT_PUBLIC_STACK_EMULATOR_ENABLED,
  NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID,
} as const;

// This will be replaced with the actual env vars after a docker build
const _postBuildEnvVars = {
  NEXT_PUBLIC_STACK_API_URL: {
    'default': 'STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_API_URL',
    'client': 'STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_CLIENT_STACK_API_URL',
    'server': 'STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SERVER_STACK_API_URL',
  },
  NEXT_PUBLIC_STACK_DASHBOARD_URL: {
    'default': 'STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_DASHBOARD_URL',
    'client': 'STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_CLIENT_STACK_DASHBOARD_URL',
    'server': 'STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL',
  },
  NEXT_PUBLIC_STACK_PROJECT_ID: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_PROJECT_ID",
  NEXT_PUBLIC_POSTHOG_KEY: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_POSTHOG_KEY",
  NEXT_PUBLIC_STACK_SVIX_SERVER_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_SVIX_SERVER_URL",
  NEXT_PUBLIC_SENTRY_DSN: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SENTRY_DSN",
  NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY",
  NEXT_PUBLIC_STACK_EMULATOR_ENABLED: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_EMULATOR_ENABLED",
  NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID",
} satisfies typeof _inlineEnvVars;

// If this is not replaced with "true", then we will not use inline env vars
const _usePostBuildEnvVars = 'STACK_ENV_VAR_SENTINEL_USE_INLINE_ENV_VARS';

export function getPublicEnvVar(name: keyof typeof _inlineEnvVars) {
  eval("// this is a hack to force the compiler not to do any smart optimizations");
  const value = _usePostBuildEnvVars.slice(0) === 'true' ? _postBuildEnvVars[name] : _inlineEnvVars[name];

  // Helper function to check if a value is a sentinel
  const isSentinel = (str?: string) => {
    return _usePostBuildEnvVars.slice(0) === 'true' && str && str.startsWith('STACK_ENV_VAR_SENTINEL');
  };

  // If it's a dictionary with client/server values
  if (typeof value === 'object') {
    const preferredValue = isBrowserLike() ? value.client : value.server;

    // Check for sentinel values
    if (isSentinel(preferredValue)) {
      return isSentinel(value.default) ? undefined : value.default;
    }
    if (isSentinel(value.default)) {
      return undefined;
    }

    return preferredValue || value.default;
  } else if (typeof value === 'string') {
    if (isSentinel(value)) {
      return undefined;
    }
    return value;
  } else {
    return undefined;
  }
}

