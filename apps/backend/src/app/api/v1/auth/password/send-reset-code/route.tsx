import { yupObject, yupString, yupNumber, urlSchema, emailSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { resetPasswordVerificationCodeHandler } from "../reset/verification-code-handler";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { usersCrudHandlers } from "../../../users/crud";
import { wait } from "@stackframe/stack-shared/dist/utils/promises";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Send reset password code",
    description: "Send a code to the user's email address for resetting the password.",
    tags: ["Password"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).required(),
    body: yupObject({
      email: emailSchema.required(),
      callback_url: urlSchema.required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      success: yupString().oneOf(["maybe, only if user with e-mail exists"]).required(),
    }).required(),
  }),
  async handler({ auth: { project }, body: { email, callback_url: callbackUrl } }) {
    if (!project.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    // TODO filter in the query
    const allUsers = await usersCrudHandlers.adminList({
      project,
    });
    const users = allUsers.items.filter((user) => user.primary_email === email && user.auth_with_email);
    if (users.length > 1) {
      throw new StackAssertionError("Multiple users found with the same email and email auth enabled; this should never happen", { users });
    }
    if (users.length === 0) {
      await wait(2000 + Math.random() * 1000);
      return {
        statusCode: 200,
        bodyType: "json",
        body: {
          success: "maybe, only if user with e-mail exists",
        },
      };
    }
    const user = users[0];

    await resetPasswordVerificationCodeHandler.sendCode({
      project,
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
