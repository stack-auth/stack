import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { sendEmailFromTemplate } from "@/lib/emails";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { signInVerificationCodeHandler } from "../sign-in/verification-code-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, signInEmailSchema, verificationLinkRedirectUrlSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { usersCrudHandlers } from "../../../users/crud";

export const POST = createSmartRouteHandler({
  request: yup.object({
    auth: yup.object({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).required(),
    body: yup.object({
      email: signInEmailSchema.required(),
      redirectUrl: verificationLinkRedirectUrlSchema,
    }).required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    bodyType: yup.string().oneOf(["success"]).required(),
  }),
  async handler({ auth: { project }, body: { email, redirectUrl } }, fullReq) {
    if (!project.evaluatedConfig.magicLinkEnabled) {
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
      throw new StackAssertionError(`Multiple users found in the database with the same primary email ${email}, and all with e-mail sign-in allowed. This should never happen (only non-email/OAuth accounts are allowed to share the same primaryEmail).`);
    }

    const userPrisma = usersPrisma.length > 0 ? usersPrisma[0] : null;
    const isNewUser = !userPrisma;
    let userObj: Pick<NonNullable<typeof userPrisma>, "projectUserId" | "displayName" | "primaryEmail"> | null = userPrisma;
    if (!userObj) {
      // TODO this should be in the same transaction as the read above
      const createdUser = await usersCrudHandlers.adminCreate({
        project,
        data: {
          auth_with_email: true,
          primary_email: email,
          primary_email_verified: false,
        },
      });
      userObj = {
        projectUserId: createdUser.id,
        displayName: createdUser.display_name,
        primaryEmail: createdUser.primary_email,
      };
    }

    const { link } = await signInVerificationCodeHandler.sendCode({
      project,
      method: { email },
      data: {
        user_id: userObj.projectUserId,
        is_new_user: isNewUser,
      },
      redirectUrl,
    });

    await sendEmailFromTemplate({
      project,
      email,
      templateId: "MAGIC_LINK",
      variables: {
        userDisplayName: userObj.displayName,
        userPrimaryEmail: userObj.primaryEmail,
        projectDisplayName: project.displayName,
        magicLink: link.toString(),
      },
    });
    
    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
