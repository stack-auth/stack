import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { comparePassword } from "@stackframe/stack-shared/dist/utils/password";
import { createAuthTokens } from "@/lib/tokens";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { createMfaRequiredError } from "../../mfa/sign-in/verification-code-handler";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Sign in with email and password",
    description: "Sign in to an account with email and password",
    tags: ["Password"],
  },
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
  async handler({ auth: { project }, body: { email, password } }) {
    if (!project.config.credential_enabled) {
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

    if (!(await comparePassword(password, user?.passwordHash || ""))) {
      throw new KnownErrors.EmailPasswordMismatch();
    }

    if (!user) {
      throw new StackAssertionError("This should never happen (the comparePassword call should've already caused this to fail)");
    }

    if (user.requiresTotpMfa) {
      throw await createMfaRequiredError({
        project,
        isNewUser: false,
        userId: user.projectUserId,
      });
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
      },
    };
  },
});
