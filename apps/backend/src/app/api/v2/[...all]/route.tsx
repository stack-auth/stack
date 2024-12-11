import { NextResponse } from 'next/server';
import { createMigrationRoute } from '../../../../route-handlers/migration-route';

const route = createMigrationRoute({
  '/api/v1/users': {
    POST: async (req) => {
      return NextResponse.json({ 'hi': 'asdf' });
    },
  },
});

export const GET = route.GET;
export const POST = route.POST;
export const PUT = route.PUT;
export const DELETE = route.DELETE;
export const PATCH = route.PATCH;
