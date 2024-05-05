import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";

const postSchema = yup.object({
  body: yup.object({
    refreshToken: yup.string().default(""),
  })
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { body: { refreshToken } } = await deprecatedParseRequest(req, postSchema);

  const res = await prismaClient.projectUserRefreshToken.deleteMany({
    where: {
      refreshToken,
    },
  });

  return new Response(JSON.stringify({
    signedOut: res.count > 0,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
});
