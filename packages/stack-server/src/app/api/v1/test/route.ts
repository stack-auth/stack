import { deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { NextRequest, NextResponse } from "next/server";

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  return NextResponse.json({ok: true,});
});
