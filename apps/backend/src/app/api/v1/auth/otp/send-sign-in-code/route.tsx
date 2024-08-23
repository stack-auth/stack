import { sendEmailFromTemplate } from "@/lib/emails";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, emailOtpSignInCallbackUrlSchema, signInEmailSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { usersCrudHandlers } from "../../../users/crud";
import { signInVerificationCodeHandler } from "../sign-in/verification-code-handler";
import { KnownErrors } from "@stackframe/stack-shared";

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
  async handler({ auth: { project }, body: { email, callback_url: callbackUrl } }, fullReq) {
    if (!project.config.magic_link_enabled) {
      throw new StatusError(StatusError.Forbidden, "Magic link is not enabled for this project");
    }

    const authMethod = await prismaClient.otpAuthMethod.findUnique({
      where: {
        projectId_contactChannelType_contactChannelValue: {
          projectId: project.id,
          contactChannelType: "EMAIL",
          contactChannelValue: email,
        }
      },
      include: {
        projectUser: true,
        contactChannel: true,
      }
    });

    const isNewUser = !authMethod;
    if (isNewUser && !project.config.sign_up_enabled) {
      throw new KnownErrors.SignUpNotEnabled();
    }

    let userObj: { projectUserId: string, displayName: string | null } | null = authMethod ? {
      projectUserId: authMethod.projectUser.projectUserId,
      displayName: authMethod.projectUser.displayName,
    } : null;

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
        userPrimaryEmail: email,
        magicLink: link.toString(),
      },
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
