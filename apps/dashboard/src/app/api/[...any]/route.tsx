import { nicify } from "@stackframe/stack-shared/dist/utils/strings";
import { NextRequest, NextResponse } from "next/server";
import '../../../polyfills';

const handler = async (req: NextRequest) => {
  const msg = "Stack Auth's dashboard API is no longer available. Please upgrade the version of your Stack Auth client library, or join our Discord server for assistance: https://discord.stack-auth.com";
  console.warn(`${req.headers.has('x-stack-project-id') ? `Project ${req.headers.get('x-stack-project-id')}` : "A user"} attempted to access the old dashboard API.`, nicify(req));
  return NextResponse.json({
    error: msg,
  }, {
    status: 400,
  });
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
