import { sendEmailFromTemplate } from "@/lib/emails";
import { createAuthTokens } from "@/lib/tokens";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { VerificationCodeType } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { signInResponseSchema, yupBoolean, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { usersCrudHandlers } from "../../../users/crud";
import { createMfaRequiredError } from "../../mfa/sign-in/verification-code-handler";

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
    user_id: yupString().uuid().optional(),
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
  async send(codeObj, createOptions, sendOptions: { email: string }) {
    await sendEmailFromTemplate({
      project: createOptions.project,
      email: createOptions.method.email,
      user: null,
      templateType: "magic_link",
      extraVariables: {
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
    let user;
    // the user_id check is just for the migration
    // we can rely only on is_new_user starting from the next release
    if (!data.user_id) {
      if (!data.is_new_user) {
        throw new StackAssertionError("When user ID is not provided, the user must be new");
      }

      user = await usersCrudHandlers.adminCreate({
        project,
        data: {
          primary_email: email,
          primary_email_verified: true,
          primary_email_auth_enabled: true,
          otp_auth_enabled: true,
        },
        allowedErrorTypes: [KnownErrors.UserEmailAlreadyExists],
      });
    } else {
      user = await usersCrudHandlers.adminRead({
        project,
        user_id: data.user_id,
      });
    }

    if (user.requires_totp_mfa) {
      throw await createMfaRequiredError({
        project,
        isNewUser: data.is_new_user,
        userId: user.id,
      });
    }

    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: user.id,
      useLegacyGlobalJWT: project.config.legacy_global_jwt_signing,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        refresh_token: refreshToken,
        access_token: accessToken,
        is_new_user: data.is_new_user,
        user_id: user.id,
      },
    };
  },
});
