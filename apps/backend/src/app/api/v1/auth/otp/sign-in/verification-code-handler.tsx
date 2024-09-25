import { sendEmailFromTemplate } from "@/lib/emails";
import { createAuthTokens } from "@/lib/tokens";
import { prismaClient } from "@/prisma-client";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { VerificationCodeType } from "@prisma/client";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { signInResponseSchema, yupBoolean, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { createMfaRequiredError } from "../../mfa/sign-in/verification-code-handler";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";

export const signInVerificationCodeHandler = createVerificationCodeHandler({
  metadata: {
    post: {
      summary: "Sign in with a code",
      description: "Sign in with a code",
      tags: ["OTP"],
    },
    check: {
      summary: "Check sign in code",
      description: "Check if a sign in code is valid without using it",
      tags: ["OTP"],
    }
  },
  type: VerificationCodeType.ONE_TIME_PASSWORD,
  data: yupObject({
    user_id: yupString().required(),
    is_new_user: yupBoolean().required(),
  }),
  method: yupObject({
    email: yupString().email().required(),
    type: yupString().oneOf(["legacy", "standard"]).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: signInResponseSchema.required(),
  }),
  async send(codeObj, createOptions, sendOptions: { user: UsersCrud["Admin"]["Read"] }) {
    await sendEmailFromTemplate({
      project: createOptions.project,
      user: sendOptions.user,
      email: createOptions.method.email,
      templateType: "magic_link",
      extraVariables: {
        userDisplayName: sendOptions.user.display_name,
        userPrimaryEmail: sendOptions.user.primary_email,
        magicLink: codeObj.link.toString(),
        otp: codeObj.code.slice(0, 6).toUpperCase(),
      },
      version: createOptions.method.type === "legacy" ? 1 : undefined,
    });

    return {
      nonce: codeObj.code.slice(6),
    };
  },
  async handler(project, { email }, data) {
    const authMethods = await prismaClient.otpAuthMethod.findMany({
      where: {
        projectId: project.id,
        contactChannel: {
          type: "EMAIL",
          value: email,
        },
      },
      include: {
        projectUser: true,
      }
    });

    if (authMethods.length === 0) {
      throw new StackAssertionError("Tried to use OTP sign in but auth method was not found?");
    }
    if (authMethods.length > 1) {
      throw new StackAssertionError("Tried to use OTP sign in but found multiple auth methods? The uniqueness on the DB schema should prevent this");
    }

    const authMethod = authMethods[0];

    if (authMethod.projectUser.requiresTotpMfa) {
      throw await createMfaRequiredError({
        project,
        isNewUser: data.is_new_user,
        userId: authMethod.projectUserId,
      });
    }

    await prismaClient.contactChannel.update({
      where: {
        projectId_projectUserId_type_value: {
          projectId: project.id,
          projectUserId: authMethod.projectUserId,
          type: "EMAIL",
          value: email,
        }
      },
      data: {
        isVerified: true,
      },
    });

    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: authMethod.projectUserId,
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
