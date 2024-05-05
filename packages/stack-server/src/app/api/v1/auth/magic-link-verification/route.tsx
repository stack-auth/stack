import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { KnownErrors } from "@stackframe/stack-shared";
import { createAuthTokens } from "@/lib/tokens";

const postSchema = yup.object({
  body: yup.object({
    code: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { body: { code } } = await deprecatedParseRequest(req, postSchema);

  const codeRecord = await prismaClient.projectUserMagicLinkCode.findUnique({
    where: {
      code
    },
    include: {
      projectUser: true,
    },
  });

  if (!codeRecord) {
    throw new KnownErrors.MagicLinkCodeNotFound();
  }

  if (codeRecord.expiresAt < new Date()) {
    throw new KnownErrors.MagicLinkCodeExpired();
  }

  if (codeRecord.usedAt) {
    throw new KnownErrors.MagicLinkCodeAlreadyUsed();
  }
  
  await prismaClient.projectUser.update({
    where: {
      projectId_projectUserId: {
        projectId: codeRecord.projectId,
        projectUserId: codeRecord.projectUserId,
      },
    },
    data: {
      primaryEmailVerified: true,
    },
  });

  await prismaClient.projectUserMagicLinkCode.update({
    where: {
      code,
    },
    data: {
      usedAt: new Date(),
    },
  });

  const { refreshToken, accessToken } = await createAuthTokens({ 
    projectId: codeRecord.projectId,
    projectUserId: codeRecord.projectUserId,
  });

  return NextResponse.json({
    refreshToken,
    accessToken,
    newUser: codeRecord.newUser,
  });
});
