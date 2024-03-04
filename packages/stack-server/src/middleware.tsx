import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { wait } from '@stackframe/stack-shared/dist/utils/promises';

const allowedCorsHeaders = [
  'authorization',
  'content-type',
  'x-stack-project-id',
  'x-stack-publishable-client-key',
  'x-stack-secret-server-key',
  'x-stack-super-secret-admin-key',
  'x-stack-admin-access-token',
];
 
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': allowedCorsHeaders.join(', '),
      },
    });
  }

  return NextResponse.next();
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
};
