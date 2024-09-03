import { NextRequest, NextResponse } from "next/server";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import "../../../polyfills";

const handler = async (req: NextRequest) => {
  const msg =
    "Stack Auth's dashboard API is no longer available. Please upgrade the version of your Stack Auth client library, or join our Discord server for assistance: https://discord.stack-auth.com";
  captureError("old-dashboard-api", new StackAssertionError(msg, { req }));
  return NextResponse.json(
    {
      error: msg,
    },
    {
      status: 400,
    },
  );
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
