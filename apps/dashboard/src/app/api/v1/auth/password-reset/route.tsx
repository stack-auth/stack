import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { KnownErrors } from "@stackframe/stack-shared";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

const postSchema = yup.object({
  body: yup.object({
    code: yup.string().required(),
    password: yup.string().optional(),
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
    throw new KnownErrors.VerificationCodeNotFound();
  }

  if (codeRecord.expiresAt < new Date()) {
    throw new KnownErrors.VerificationCodeExpired();
  }

  if (codeRecord.usedAt) {
    throw new KnownErrors.VerificationCodeAlreadyUsed();
  }

  if (onlyVerifyCode) {
    return new NextResponse();
  }

  if (!password) {
    throw new StatusError(StatusError.BadRequest, "Password is required when onlyVerify is false");
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
