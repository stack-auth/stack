import { createAuthTokens, encodeAccessToken } from "@/lib/tokens";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { yupObject, clientOrHigherAuthTypeSchema, adaptSchema, signInEmailSchema, yupString, emailVerificationCallbackUrlSchema, yupNumber } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { comparePassword } from "@stackframe/stack-shared/dist/utils/password";

export const POST = createSmartRouteHandler({
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).required(),
    body: yupObject({
      email: yupString().email().required(),
      password: yupString().required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      access_token: yupString().required(),
      refresh_token: yupString().required(),
      user_id: yupString().required(),
    }).required(),
  }),
  async handler({ auth: { project }, body: { email, password } }, fullReq) {
    if (!project.evaluatedConfig.credentialEnabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }
  
    const users = await prismaClient.projectUser.findMany({
      where: {
        projectId: project.id,
        primaryEmail: email,
        authWithEmail: true,
      },
    });
    if (users.length > 1) {
      throw new StackAssertionError("Multiple users found with the same email", { users });
    }
    const user = users.length > 0 ? users[0] : null;
  
    if (!await comparePassword(password, user?.passwordHash || "")) {
      throw new KnownErrors.EmailPasswordMismatch();
    }
  
    if (!user) {
      throw new StackAssertionError("This should never happen (the comparePassword call should've already caused this to fail)");
    }

    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: user.projectUserId,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: user.projectUserId,
      }
    };
  },
});
