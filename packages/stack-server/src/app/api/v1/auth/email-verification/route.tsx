import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { KnownErrors } from "@stackframe/stack-shared";

const postSchema = yup.object({
  body: yup.object({
    code: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { body: { code } } = await deprecatedParseRequest(req, postSchema);

  const codeRecord = await prismaClient.projectUserEmailVerificationCode.findUnique({
    where: {
      code
    },
  });

  if (!codeRecord) {
    throw new KnownErrors.EmailVerificationCodeNotFound();
  }

  if (codeRecord.expiresAt < new Date()) {
    throw new KnownErrors.EmailVerificationCodeExpired();
  }

  if (codeRecord.usedAt) {
    throw new KnownErrors.EmailVerificationCodeAlreadyUsed();
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

  await prismaClient.projectUserEmailVerificationCode.update({
    where: {
      code,
    },
    data: {
      usedAt: new Date(),
    },
  });

  return new NextResponse();
});
