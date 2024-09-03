import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { yupObject, yupString, yupNumber } from "@stackframe/stack-shared/dist/schema-fields";
import { adaptSchema, clientOrHigherAuthTypeSchema, emailVerificationCallbackUrlSchema, signInEmailSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { createAuthTokens } from "@/lib/tokens";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrudHandlers } from "../../../users/crud";
import { contactChannelVerificationCodeHandler } from "../../../contact-channels/verify/verification-code-handler";
import { createMfaRequiredError } from "../../mfa/sign-in/verification-code-handler";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Sign up with email and password",
    description: "Create a new account with email and password",
    tags: ["Password"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).required(),
    body: yupObject({
      email: signInEmailSchema.required(),
      password: yupString().required(),
      verification_callback_url: emailVerificationCallbackUrlSchema.required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      access_token: yupString().required(),
      refresh_token: yupString().required(),
      user_id: yupString().required(),
    }).required(),
  }),
  async handler({ auth: { project }, body: { email, password, verification_callback_url: verificationCallbackUrl } }) {
    if (!project.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      throw passwordError;
    }

    if (!project.config.sign_up_enabled) {
      throw new KnownErrors.SignUpNotEnabled();
    }

    const createdUser = await usersCrudHandlers.adminCreate({
      project,
      data: {
        primary_email_auth_enabled: true,
        primary_email: email,
        primary_email_verified: false,
        password,
      },
      allowedErrorTypes: [KnownErrors.UserEmailAlreadyExists],
    });

    try {
      await contactChannelVerificationCodeHandler.sendCode({
        project,
        data: {
          user_id: createdUser.id,
        },
        method: {
          email,
        },
        callbackUrl: verificationCallbackUrl,
      }, {
        user: createdUser,
      });
    } catch (error) {
      captureError("Error sending verification code on sign up. Continued without sending verification code.", error);
    }

    if (createdUser.requires_totp_mfa) {
      throw await createMfaRequiredError({
        project,
        isNewUser: true,
        userId: createdUser.id,
      });
    }

    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: createdUser.id,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: createdUser.id,
      },
    };
  },
});
