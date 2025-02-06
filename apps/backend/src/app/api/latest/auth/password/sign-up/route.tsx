import { createAuthTokens } from "@/lib/tokens";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { adaptSchema, clientOrHigherAuthTypeSchema, emailVerificationCallbackUrlSchema, passwordSchema, signInEmailSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { contactChannelVerificationCodeHandler } from "../../../contact-channels/verify/verification-code-handler";
import { usersCrudHandlers } from "../../../users/crud";
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
      tenancy: adaptSchema,
    }).defined(),
    body: yupObject({
      email: signInEmailSchema.defined(),
      password: passwordSchema.defined(),
      verification_callback_url: emailVerificationCallbackUrlSchema.defined(),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      access_token: yupString().defined(),
      refresh_token: yupString().defined(),
      user_id: yupString().defined(),
    }).defined(),
  }),
  async handler({ auth: { tenancy }, body: { email, password, verification_callback_url: verificationCallbackUrl } }, fullReq) {
    if (!tenancy.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      throw passwordError;
    }

    if (!tenancy.config.sign_up_enabled) {
      throw new KnownErrors.SignUpNotEnabled();
    }

    const createdUser = await usersCrudHandlers.adminCreate({
      tenancy,
      data: {
        primary_email: email,
        primary_email_verified: false,
        primary_email_auth_enabled: true,
        password,
      },
      allowedErrorTypes: [KnownErrors.UserEmailAlreadyExists],
    });

    try {
      await contactChannelVerificationCodeHandler.sendCode({
        tenancy,
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
      if (error instanceof KnownErrors.RedirectUrlNotWhitelisted) {
        throw error;
      } else {
        // we can ignore it because it's not critical, but we should log it
        // a common error is that the developer's specified email service is down
        // later, we should let the user know instead of logging this to Sentry
        captureError("send-sign-up-verification-code", error);
      }
    }

    if (createdUser.requires_totp_mfa) {
      throw await createMfaRequiredError({
        tenancy,
        isNewUser: true,
        userId: createdUser.id,
      });
    }

    const { refreshToken, accessToken } = await createAuthTokens({
      tenancyId: tenancy.id,
      projectUserId: createdUser.id,
      useLegacyGlobalJWT: tenancy.config.legacy_global_jwt_signing,
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
