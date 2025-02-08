import { getAuthContactChannel } from "@/lib/contact-channel";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema, emailSchema, urlSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { wait } from "@stackframe/stack-shared/dist/utils/promises";
import { usersCrudHandlers } from "../../../users/crud";
import { resetPasswordVerificationCodeHandler } from "../reset/verification-code-handler";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Send reset password code",
    description: "Send a code to the user's email address for resetting the password.",
    tags: ["Password"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      tenancy: adaptSchema,
    }).defined(),
    body: yupObject({
      email: emailSchema.defined(),
      callback_url: urlSchema.defined(),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      success: yupString().oneOf(["maybe, only if user with e-mail exists"]).defined(),
    }).defined(),
  }),
  async handler({ auth: { tenancy }, body: { email, callback_url: callbackUrl } }, fullReq) {
    if (!tenancy.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    // TODO filter in the query
    const contactChannel = await getAuthContactChannel(
      prismaClient,
      {
        tenancyId: tenancy.id,
        type: "EMAIL",
        value: email,
      },
    );

    if (!contactChannel) {
      await wait(2000 + Math.random() * 1000);
      return {
        statusCode: 200,
        bodyType: "json",
        body: {
          success: "maybe, only if user with e-mail exists",
        },
      };
    }
    const user = await usersCrudHandlers.adminRead({
      tenancy,
      user_id: contactChannel.projectUserId,
    });
    await resetPasswordVerificationCodeHandler.sendCode({
      tenancy,
      callbackUrl,
      method: {
        email,
      },
      data: {
        user_id: user.id,
      },
    }, {
      user,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        success: "maybe, only if user with e-mail exists",
      },
    };
  },
});
