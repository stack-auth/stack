import { getEnvVariable, getNodeEnvironment } from '@stackframe/stack-shared/dist/utils/env';
import { StackAssertionError } from '@stackframe/stack-shared/dist/utils/errors';
import { wait } from '@stackframe/stack-shared/dist/utils/promises';
import './polyfills';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const corsAllowedRequestHeaders = [
  // General
  'content-type',
  'authorization',  // used for OAuth basic authentication
  'x-stack-project-id',
  'x-stack-override-error-status',
  'x-stack-random-nonce',  // used to forcefully disable some caches
  'x-stack-client-version',
  'x-stack-disable-artificial-development-delay',

  // Project auth
  'x-stack-access-type',
  'x-stack-publishable-client-key',
  'x-stack-secret-server-key',
  'x-stack-super-secret-admin-key',
  'x-stack-admin-access-token',

  // User auth
  'x-stack-refresh-token',
  'x-stack-access-token',

  // Sentry
  'baggage',
  'sentry-trace',
];

const corsAllowedResponseHeaders = [
  'content-type',
  'x-stack-actual-status',
  'x-stack-known-error',
];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const delay = +getEnvVariable('STACK_ARTIFICIAL_DEVELOPMENT_DELAY_MS', '0');
  if (delay) {
    if (getNodeEnvironment().includes('production')) {
      throw new StackAssertionError('STACK_ARTIFICIAL_DEVELOPMENT_DELAY_MS is only allowed in development');
    }
    if (!request.headers.get('x-stack-disable-artificial-development-delay')) {
      await wait(delay);
    }
  }

  const url = new URL(request.url);
  const isApiRequest = url.pathname.startsWith('/api/');

  const newRequestHeaders = new Headers(request.headers);
  // store the direct IP address of the requester or proxy so we can read it with `headers()` later
  newRequestHeaders.set("x-stack-direct-requester-or-proxy-ip", request.ip ?? '');

  const responseInit = isApiRequest ? {
    request: {
      headers: newRequestHeaders,
    },
    headers: {
      // CORS headers
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": corsAllowedRequestHeaders.join(', '),
      "Access-Control-Expose-Headers": corsAllowedResponseHeaders.join(', '),
    },
  } as const : undefined;

  // we want to allow preflight requests to pass through
  // even if the API route does not implement OPTIONS
  if (request.method === 'OPTIONS' && isApiRequest) {
    return new Response(null, responseInit);
  }

  return NextResponse.next(responseInit);
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
};
