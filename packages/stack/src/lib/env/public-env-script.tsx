import { unstable_noStore as noStore } from 'next/cache';
import Script from 'next/script';
import { type FC } from 'react';

// Set the key that the PublicEnvScript component uses to set the environment variables
// on the window object in the browser. eg. window.__STACK_ENV__
export const PUBLIC_ENV_KEY = '__STACK_ENV__';

// Get a list of environment variables that start with `NEXT_PUBLIC_`.
function getPublicEnv() {
  const publicEnv = Object.keys(process.env)
    .filter((key) => /^NEXT_PUBLIC_/i.test(key))
    .reduce(
      (env, key) => ({
        ...env,
        [key]: process.env[key],
      }),
      {} as NodeJS.ProcessEnv,
    );

  return publicEnv;
}

/**
 * Makes public environment variables available on the window object in the browser.
 *
 * This component disables Next.js' caching mechanism to ensure that the
 * environment variables are always up-to-date when this component renders.
 *
 * Usage:
 * ```tsx
 * <head>
 *   <PublicEnvScript />
 * </head>
 * ```
 */
export const PublicEnvScript: FC = () => {
  // Opt into dynamic rendering
  // https://nextjs.org/docs/app/api-reference/functions/unstable_noStore
  noStore();

  // Env values will now be evaluated at runtime
  const publicEnv = getPublicEnv();

  return <Script
    id="stack-public-env-script"
    strategy="beforeInteractive"
    dangerouslySetInnerHTML={{
      __html: `window['${PUBLIC_ENV_KEY}'] = ${JSON.stringify(publicEnv)}`,
    }}
  />;
};
