/* eslint-disable no-restricted-syntax */

const _inlineEnvVars = {
  NEXT_PUBLIC_STACK_API_URL: process.env.NEXT_PUBLIC_STACK_API_URL,
  NEXT_PUBLIC_STACK_DASHBOARD_URL: process.env.NEXT_PUBLIC_STACK_DASHBOARD_URL,
  NEXT_PUBLIC_STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_STACK_SVIX_SERVER_URL: process.env.NEXT_PUBLIC_STACK_SVIX_SERVER_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY: process.env.NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY,
};

// This will be replaced with the actual env vars after a docker build
const _postBuildEnvVars = {
  NEXT_PUBLIC_STACK_API_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_API_URL",
  NEXT_PUBLIC_STACK_DASHBOARD_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_DASHBOARD_URL",
  NEXT_PUBLIC_STACK_PROJECT_ID: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_PROJECT_ID",
  NEXT_PUBLIC_POSTHOG_KEY: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_POSTHOG_KEY",
  NEXT_PUBLIC_STACK_SVIX_SERVER_URL: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_SVIX_SERVER_URL",
  NEXT_PUBLIC_SENTRY_DSN: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SENTRY_DSN",
  NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY: "STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY",
} satisfies Record<keyof typeof _inlineEnvVars, string>;

// If this is not replaced with "true", then we will not use inline env vars
const _usePostBuildEnvVars = 'STACK_ENV_VAR_SENTINEL_USE_INLINE_ENV_VARS';

export function getPublicEnvVar(name: keyof typeof _inlineEnvVars) {
  eval("// this is a hack to force the compiler not to do any smart optimizations");
  if (_usePostBuildEnvVars.slice(0) === 'true') {
    const value = _postBuildEnvVars[name];
    if (value.startsWith('STACK_ENV_VAR_SENTINEL')) {
      return undefined;
    }
    return value;
  } else {
    return _inlineEnvVars[name];
  }
}

