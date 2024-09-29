import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema, emailOtpSignInCallbackUrlSchema, signInEmailSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import semver from "semver";
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
    clientVersion: yupObject({
      version: yupString().optional(),
      sdk: yupString().optional(),
    }).optional(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      nonce: yupString().required(),
    }).required(),
  }),
  async handler({ auth: { project }, body: { email, callback_url: callbackUrl }, clientVersion }, fullReq) {
    if (!project.config.magic_link_enabled) {
      throw new StatusError(StatusError.Forbidden, "Magic link is not enabled for this project");
    }

    const contactChannel = await prismaClient.contactChannel.findUnique({
      where: {
        projectId_type_value_usedForAuth: {
          projectId: project.id,
          type: "EMAIL",
          value: email,
          usedForAuth: "TRUE",
        }
      },
      include: {
        projectUser: {
          include: {
            authMethods: {
              include: {
                otpAuthMethod: true,
              }
            }
          }
        }
      }
    });

    const otpAuthMethod = contactChannel?.projectUser.authMethods.find((m) => m.otpAuthMethod)?.otpAuthMethod;

    const isNewUser = !otpAuthMethod;
    if (isNewUser && !project.config.sign_up_enabled) {
      throw new KnownErrors.SignUpNotEnabled();
    }

    let user;

    if (!otpAuthMethod) {
      // TODO this should be in the same transaction as the read above
      user = await usersCrudHandlers.adminCreate({
        project,
        data: {
          primary_email_auth_enabled: true,
          primary_email: email,
          primary_email_verified: false,
        },
        allowedErrorTypes: [KnownErrors.UserEmailAlreadyExists],
      });
    } else {
      user = await usersCrudHandlers.adminRead({
        project,
        user_id: contactChannel.projectUser.projectUserId,
      });
    }

    let type: "legacy" | "standard";
    if (clientVersion?.sdk === "@stackframe/stack" && semver.valid(clientVersion.version) && semver.lte(clientVersion.version, "2.5.37")) {
      type = "legacy";
    } else {
      type = "standard";
    }

    const { nonce } = await signInVerificationCodeHandler.sendCode(
      {
        project,
        callbackUrl,
        method: { email, type },
        data: {
          user_id: user.id,
          is_new_user: isNewUser,
        },
      },
      { user }
    );

    return {
      statusCode: 200,
      bodyType: "json",
      body: { nonce },
    };
  },
});
