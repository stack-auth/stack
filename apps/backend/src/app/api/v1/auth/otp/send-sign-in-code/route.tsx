import { KnownErrors } from "@stackframe/stack-shared";
import {
  adaptSchema,
  clientOrHigherAuthTypeSchema,
  emailOtpSignInCallbackUrlSchema,
  signInEmailSchema,
  yupNumber,
  yupObject,
  yupString,
} from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { sendEmailFromTemplate } from "@/lib/emails";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { usersCrudHandlers } from "../../../users/crud";
import { signInVerificationCodeHandler } from "../sign-in/verification-code-handler";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Send sign-in code",
    description: "Send a code to the user's email address for sign-in.",
    tags: ["OTP"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).required(),
    body: yupObject({
      email: signInEmailSchema.required(),
      callback_url: emailOtpSignInCallbackUrlSchema.required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async handler({ auth: { project }, body: { email, callback_url: callbackUrl } }) {
    if (!project.config.magic_link_enabled) {
      throw new StatusError(StatusError.Forbidden, "Magic link is not enabled for this project");
    }

    const usersPrisma = await prismaClient.projectUser.findMany({
      where: {
        projectId: project.id,
        primaryEmail: email,
        authWithEmail: true,
      },
    });
    if (usersPrisma.length > 1) {
      throw new StackAssertionError(
        `Multiple users found in the database with the same primary email ${email}, and all with e-mail sign-in allowed. This should never happen (only non-email/OAuth accounts are allowed to share the same primaryEmail).`,
      );
    }

    const userPrisma = usersPrisma.length > 0 ? usersPrisma[0] : null;
    const isNewUser = !userPrisma;
    if (isNewUser && !project.config.sign_up_enabled) {
      throw new KnownErrors.SignUpNotEnabled();
    }

    let userObj: Pick<NonNullable<typeof userPrisma>, "projectUserId" | "displayName" | "primaryEmail"> | null = userPrisma;
    if (!userObj) {
      // TODO this should be in the same transaction as the read above
      const createdUser = await usersCrudHandlers.adminCreate({
        project,
        data: {
          primary_email_auth_enabled: true,
          primary_email: email,
          primary_email_verified: false,
        },
        allowedErrorTypes: [KnownErrors.UserEmailAlreadyExists],
      });
      userObj = {
        projectUserId: createdUser.id,
        displayName: createdUser.display_name,
        primaryEmail: createdUser.primary_email,
      };
    }

    const { link } = await signInVerificationCodeHandler.createCode({
      project,
      method: { email },
      data: {
        user_id: userObj.projectUserId,
        is_new_user: isNewUser,
      },
      callbackUrl,
    });

    // TODO use signInVerificationCodeHandler.sendCode instead of .createCode and then sending the code manually
    await sendEmailFromTemplate({
      project,
      // TODO fill user object instead of specifying the extra variables below manually (sIVCH.sendCode would do this already)
      user: null,
      email,
      templateType: "magic_link",
      extraVariables: {
        userDisplayName: userObj.displayName,
        userPrimaryEmail: userObj.primaryEmail,
        magicLink: link.toString(),
      },
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
