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
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: signInResponseSchema.required(),
  }),
  async send(codeObj, createOptions, sendOptions: { user: UsersCrud["Admin"]["Read"] }) {
    // note: the /auth/otp/send-sign-in-code endpoint doesn't call this, instead it calls createCode and then manually sends the e-mail
    // (we should change that at some point)
    await sendEmailFromTemplate({
      project: createOptions.project,
      user: sendOptions.user,
      email: createOptions.method.email,
      templateType: "magic_link",
      extraVariables: {
        magicLink: codeObj.link.toString(),
      },
    });
  },
  async handler(project, { email }, data) {
    const authMethod = await prismaClient.otpAuthMethod.findUnique({
      where: {
        projectId_contactChannelType_contactChannelValue: {
          projectId: project.id,
          contactChannelType: "EMAIL",
          contactChannelValue: email,
        },
      },
      include: {
        projectUser: true,
      }
    });

    if (!authMethod) {
      throw new StackAssertionError("authMethod not found");
    }

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
