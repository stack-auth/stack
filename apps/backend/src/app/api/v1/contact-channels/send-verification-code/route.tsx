import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema, emailVerificationCallbackUrlSchema, signInEmailSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { contactChannelVerificationCodeHandler } from "../verify/verification-code-handler";

/* deprecated, use /contact-channels/[user_id]/[contact_channel_id]/send-verification-code instead */
export const POST = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema.required(),
      user: adaptSchema.required(),
    }).required(),
    body: yupObject({
      email: signInEmailSchema.required(),
      callback_url: emailVerificationCallbackUrlSchema.required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async handler({ auth: { project, user }, body: { email, callback_url: callbackUrl } }) {
    if (user.primary_email !== email) {
      throw new KnownErrors.EmailIsNotPrimaryEmail(email, user.primary_email);
    }
    if (user.primary_email_verified) {
      throw new KnownErrors.EmailAlreadyVerified();
    }

    await contactChannelVerificationCodeHandler.sendCode({
      project,
      data: {
        user_id: user.id,
      },
      method: {
        email,
      },
      callbackUrl,
    }, {
      user,
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
