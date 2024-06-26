import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { sendEmailFromTemplate } from "@/lib/emails";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { createTeamOnSignUp } from "@/lib/users";
import { signInVerificationCodeHandler } from "../sign-in/verification-code-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, signInEmailSchema, verificationLinkRedirectUrlSchema } from "@stackframe/stack-shared/dist/schema-fields";

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
  
    const users = await prismaClient.projectUser.findMany({
      where: {
        projectId: project.id,
        primaryEmail: email,
        authWithEmail: true,
      },
    });

    if (users.length > 1) {
      throw new StackAssertionError(`Multiple users found in the database with the same primary email ${email}, and all with e-mail sign-in allowed. This should never happen (only non-email/OAuth accounts are allowed to share the same primaryEmail).`);
    }
    let user = users.length > 0 ? users[0] : null;
    const isNewUser = !user;
    if (!user) {
      user ??= await prismaClient.projectUser.create({
        data: {
          projectId: project.id,
          primaryEmail: email,
          primaryEmailVerified: false,
          authWithEmail: true,
        },
      });
  
      await createTeamOnSignUp(project.id, user.projectUserId);
    }

    const { link } = await signInVerificationCodeHandler.sendCode({
      project,
      method: { email },
      data: {
        user_id: user.projectUserId,
        is_new_user: isNewUser,
      },
      redirectUrl,
    });

    await sendEmailFromTemplate({
      project,
      email,
      templateId: "MAGIC_LINK",
      variables: {
        userDisplayName: user.displayName,
        userPrimaryEmail: user.primaryEmail,
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
