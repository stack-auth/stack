import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { deindent } from '@stackframe/stack-shared/dist/utils/strings';

const corsAllowedRequestHeaders = [
  'authorization',
  'content-type',
  'x-stack-project-id',
  'x-stack-publishable-client-key',
  'x-stack-secret-server-key',
  'x-stack-super-secret-admin-key',
  'x-stack-admin-access-token',
  'x-stack-override-error-status',
];

const corsAllowedResponseHeaders = [
  'content-type',
  'x-stack-actual-status',
  'x-stack-known-error',
];
 
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const isApiRequest = url.pathname.startsWith('/api/');

  // default headers
  const responseInit: ResponseInit = {
    headers: {
      // CORS headers
      ...!isApiRequest ? {} : {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": corsAllowedRequestHeaders.join(', '),
        "Access-Control-Expose-Headers": corsAllowedResponseHeaders.join(', '),
      },
    },
  };

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
