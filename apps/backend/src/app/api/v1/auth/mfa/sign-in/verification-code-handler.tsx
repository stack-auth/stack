import { yupObject, yupString, yupNumber, yupBoolean } from "@stackframe/stack-shared/dist/schema-fields";
import { prismaClient } from "@/prisma-client";
import { createAuthTokens } from "@/lib/tokens";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { signInResponseSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { VerificationCodeType } from "@prisma/client";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { TOTPController } from "oslo/otp";
import { KnownErrors } from "@stackframe/stack-shared";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";

export const mfaVerificationCodeHandler = createVerificationCodeHandler({
  metadata: {
    post: {
      summary: "MFA sign in",
      description: "Complete multi-factor authorization to sign in, with a TOTP and an MFA attempt code",
      tags: ["OTP"],
    },
    check: {
      summary: "Verify MFA",
      description: "Check if the MFA attempt is valid without using it",
      tags: ["OTP"],
    }
  },
  type: VerificationCodeType.ONE_TIME_PASSWORD,
  data: yupObject({
    user_id: yupString().required(),
    is_new_user: yupBoolean().required(),
  }),
  method: yupObject({}),
  requestBody: yupObject({
    type: yupString().oneOf(["totp"]).required(),
    totp: yupString().required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: signInResponseSchema.required(),
  }),
  async validate(project, _, data, body) {
    const user = await prismaClient.projectUser.findUniqueOrThrow({
      where: {
        projectId_projectUserId: {
          projectId: project.id,
          projectUserId: data.user_id,
        },
      },
    });
    const totpSecret = user.totpSecret;
    if (!totpSecret) {
      throw new StackAssertionError("User does not have a TOTP secret", { user });
    }
    const isTotpValid = await new TOTPController().verify(body.totp, totpSecret);
    if (!isTotpValid) {
      throw new KnownErrors.InvalidTotpCode();
    }
  },
  async handler(project, _, data) {
    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: data.user_id,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        refresh_token: refreshToken,
        access_token: accessToken,
        is_new_user: data.is_new_user,
        user_id: data.user_id,
      },
    };
  },
});

export async function createMfaRequiredError(options: { project: ProjectsCrud["Admin"]["Read"], isNewUser: boolean, userId: string }) {
  const attemptCode = await mfaVerificationCodeHandler.createCode({
    expiresInMs: 1000 * 60 * 5,
    project: options.project,
    data: {
      user_id: options.userId,
      is_new_user: options.isNewUser,
    },
    method: {},
    callbackUrl: undefined,
  });
  return new KnownErrors.MultiFactorAuthenticationRequired(attemptCode.code);
}
