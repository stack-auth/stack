import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { KnownErrors } from "@stackframe/stack-shared";

const postSchema = yup.object({
  body: yup.object({
    code: yup.string().required(),
    password: yup.string().default(undefined),
    onlyVerifyCode: yup.boolean().default(false),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { body: { code, password, onlyVerifyCode } } = await deprecatedParseRequest(req, postSchema);

  const codeRecord = await prismaClient.projectUserPasswordResetCode.findUnique({
    where: {
      code
    },
  });

  if (!codeRecord) {
    throw new KnownErrors.PasswordResetCodeNotFound();
  }

  if (codeRecord.expiresAt < new Date()) {
    throw new KnownErrors.PasswordResetCodeExpired();
  }

  if (codeRecord.usedAt) {
    throw new KnownErrors.PasswordResetCodeAlreadyUsed();
  }

  if (onlyVerifyCode) {
    return new NextResponse();
  }

  if (!password) {
    throw new Error("Password is required when onlyVerify is false");
  }
  
  await prismaClient.projectUser.update({
    where: {
      projectId_projectUserId: {
        projectId: codeRecord.projectId,
        projectUserId: codeRecord.projectUserId,
      },
    },
    data: {
      passwordHash: await hashPassword(password),
    },
  });

  await prismaClient.projectUserPasswordResetCode.update({
    where: {
      code,
    },
    data: {
      usedAt: new Date(),
    },
  });

  return new NextResponse();
});
