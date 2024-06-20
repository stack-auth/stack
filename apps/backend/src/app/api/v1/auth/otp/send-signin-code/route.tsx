import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { SmartRequestAdaptSentinel } from "@/route-handlers/smart-request";
import { sendMagicLink } from "@/email";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared";
import { createTeamOnSignUp } from "@/lib/users";

export const POST = createSmartRouteHandler({
  request: yup.object({
    auth: yup.object({
      type: yup.string().oneOf(["client"]).required(),
      project: yup.mixed<SmartRequestAdaptSentinel>().required(),
    }).required(),
    body: yup.object({
      email: yup.string().required(),
      redirectUrl: yup.string().required(),
    }).required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    bodyType: yup.string().oneOf(["text"]).required(),
    body: yup.string().required(),
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
    
    if (
      !validateRedirectUrl(
        redirectUrl, 
        project.evaluatedConfig.domains,
        project.evaluatedConfig.allowLocalhost 
      )
    ) {
      throw new KnownErrors.RedirectUrlNotWhitelisted();
    }
    
    await sendMagicLink(project.id, user.projectUserId, redirectUrl, isNewUser);
    
    return {
      statusCode: 200,
      bodyType: "text",
      body: `OK`,
    };
  },
});
