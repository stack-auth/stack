import { VerificationCodeType } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { sendEmailFromTemplate } from "@/lib/emails";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { usersCrudHandlers } from "../../../users/crud";

export const resetPasswordVerificationCodeHandler = createVerificationCodeHandler({
  metadata: {
    post: {
      summary: "Reset password with a code",
      description: "Reset password with a code",
      tags: ["Password"],
    },
    check: {
      summary: "Check reset password code",
      description: "Check if a reset password code is valid without using it",
      tags: ["Password"],
    },
  },
  type: VerificationCodeType.PASSWORD_RESET,
  data: yupObject({
    user_id: yupString().required(),
  }),
  method: yupObject({
    email: yupString().email().required(),
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
      templateType: "password_reset",
      extraVariables: {
        passwordResetLink: codeObj.link.toString(),
      },
    });
  },
  async handler(project, _, data, { password }) {
    if (!project.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      throw passwordError;
    }

    await usersCrudHandlers.adminUpdate({
      project,
      user_id: data.user_id,
      data: {
        password,
      },
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
