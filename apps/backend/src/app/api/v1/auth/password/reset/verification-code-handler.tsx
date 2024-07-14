import { yupObject, yupString, yupNumber, yupBoolean } from "@stackframe/stack-shared/dist/schema-fields";
import { prismaClient } from "@/prisma-client";
import { createAuthTokens } from "@/lib/tokens";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { signInResponseSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { VerificationCodeType } from "@prisma/client";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { sendEmailFromTemplate } from "@/lib/emails";
import { KnownErrors } from "@stackframe/stack-shared";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";

export const resetPasswordVerificationCodeHandler = createVerificationCodeHandler({
  type: VerificationCodeType.ONE_TIME_PASSWORD,
  data: yupObject({
    user_id: yupString().required(),
  }),
  requestBody: yupObject({
    password: yupString().required(),
  }).required(),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async send(codeObj, createOptions, sendOptions: { user: UsersCrud["Admin"]["Read"] }) {
    await sendEmailFromTemplate({
      project: createOptions.project,
      user: sendOptions.user,
      email: createOptions.method.email,
      templateId: "PASSWORD_RESET",
      extraVariables: {
        passwordResetLink: codeObj.link.toString(),
      },
    });
  },
  async handler(project, { email }, data, { password }) {
    if (!project.evaluatedConfig.credentialEnabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      throw passwordError;
    }

    await prismaClient.projectUser.update({
      where: {
        projectId_projectUserId: {
          projectId: project.id,
          projectUserId: data.user_id,
        },
      },
      data: {
        passwordHash: await hashPassword(password),
      },
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
