import { yupObject, yupString, yupNumber, urlSchema, emailSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { resetPasswordVerificationCodeHandler } from "../reset/verification-code-handler";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { prismaClient } from "@/prisma-client";
import { usersCrudHandlers } from "../../../users/crud";

export const POST = createSmartRouteHandler({
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
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async handler({ auth: { project }, body: { email, callback_url: callbackUrl } }, fullReq) {
    if (!project.evaluatedConfig.credentialEnabled) {
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
      throw new KnownErrors.EmailNotAssociatedWithUser();
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
      bodyType: "success",
    };
  },
});
