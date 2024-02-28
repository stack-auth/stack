import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { parseRequest, smartRouteHandler } from "@/lib/route-handlers";

const postSchema = yup.object({
  body: yup.object({
    refreshToken: yup.string().default(""),
  })
});

export const POST = smartRouteHandler(async (req: NextRequest) => {
  const { body: { refreshToken } } = await parseRequest(req, postSchema);

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
