import { NextRequest, NextResponse } from "next/server";

const handler = async (req: NextRequest) => {
  return NextResponse.json({
    error: "Stack Auth's dashboard API is no longer available. Please upgrade the version of your Stack Auth client library, or join our Discord server for assistance: https://discord.stack-auth.com",
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
