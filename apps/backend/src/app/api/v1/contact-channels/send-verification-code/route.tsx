import * as yup from "yup";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, signInEmailSchema, emailVerificationCallbackUrlSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { sendEmailFromTemplate } from "@/lib/emails";
import { KnownErrors } from "@stackframe/stack-shared";
import { contactChannelVerificationCodeHandler } from "../verify/verification-code-handler";

export const POST = createSmartRouteHandler({
  request: yup.object({
    auth: yup.object({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema.required(),
      user: adaptSchema.required(),
    }).required(),
    body: yup.object({
      email: signInEmailSchema.required(),
      callback_url: emailVerificationCallbackUrlSchema.required(),
    }).required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    bodyType: yup.string().oneOf(["success"]).required(),
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
