import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { 
  KnownError, 
  EmailVerificationLinkInvalidErrorCode, 
  EmailVerificationLinkUsedErrorCode, 
  EmailVerificationLinkExpiredErrorCode
} from "@stackframe/stack-shared/dist/utils/types";
import { prismaClient } from "@/prisma-client";
import { parseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";

const postSchema = yup.object({
  body: yup.object({
    code: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { body: { code } } = await parseRequest(req, postSchema);

  const codeRecord = await prismaClient.projectUserEmailVerificationCode.findUnique({
    where: {
      code
    },
  });

  if (!codeRecord) {
    throw new KnownError(EmailVerificationLinkInvalidErrorCode);
  }

  if (codeRecord.expiresAt < new Date()) {
    throw new KnownError(EmailVerificationLinkExpiredErrorCode);
  }

  if (codeRecord.usedAt) {
    throw new KnownError(EmailVerificationLinkUsedErrorCode);
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
