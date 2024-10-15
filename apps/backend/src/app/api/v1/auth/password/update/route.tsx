import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { adaptSchema, clientOrHigherAuthTypeSchema, yupNumber, yupObject, yupString, yupTuple } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { comparePassword, hashPassword } from "@stackframe/stack-shared/dist/utils/password";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Update password",
    description: "Update the password of the current user, requires the old password",
    tags: ["Password"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
      user: adaptSchema.required(),
    }).required(),
    body: yupObject({
      old_password: yupString().required(),
      new_password: yupString().required(),
    }).required(),
    headers: yupObject({
      "x-stack-refresh-token": yupTuple([yupString().optional()]).optional(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async handler({ auth: { project, user }, body: { old_password, new_password }, headers: { "x-stack-refresh-token": refreshToken } }, fullReq) {
    if (!project.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    const passwordError = getPasswordError(new_password);
    if (passwordError) {
      throw passwordError;
    }

    await prismaClient.$transaction(async (tx) => {
      const authMethods = await tx.passwordAuthMethod.findMany({
        where: {
          projectId: project.id,
          projectUserId: user.id,
        },
      });

      if (authMethods.length > 1) {
        throw new StackAssertionError("User has multiple password auth methods.", {
          projectId: project.id,
          projectUserId: user.id,
        });
      } else if (authMethods.length === 0) {
        throw new KnownErrors.UserDoesNotHavePassword();
      }

      const authMethod = authMethods[0];

      if (!await comparePassword(old_password, authMethod.passwordHash)) {
        throw new KnownErrors.PasswordConfirmationMismatch();
      }

      await tx.passwordAuthMethod.update({
        where: {
          projectId_authMethodId: {
            projectId: project.id,
            authMethodId: authMethod.authMethodId,
          },
        },
        data: {
          passwordHash: await hashPassword(new_password),
        },
      });

      // reset all other refresh tokens
      await tx.projectUserRefreshToken.deleteMany({
        where: {
          projectId: project.id,
          projectUserId: user.id,
          ...refreshToken ? {
            NOT: {
              refreshToken: refreshToken[0],
            },
          } : {},
        },
      });
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
