import * as yup from "yup";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, signInEmailSchema, emailVerificationCallbackUrlSchema, yupObject, yupNumber, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { KnownErrors } from "@stackframe/stack-shared";
import { contactChannelVerificationCodeHandler } from "../verify/verification-code-handler";

export const POST = createSmartRouteHandler({
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
  async handler({ auth: { project, user }, body: { email, callback_url: callbackUrl } }, fullReq) {
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
