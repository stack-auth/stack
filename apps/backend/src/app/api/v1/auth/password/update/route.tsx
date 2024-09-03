import { KnownErrors } from "@stackframe/stack-shared";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import {
  adaptSchema,
  clientOrHigherAuthTypeSchema,
  yupNumber,
  yupObject,
  yupString,
  yupTuple,
} from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { comparePassword, hashPassword } from "@stackframe/stack-shared/dist/utils/password";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";

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
  async handler({ auth: { project, user }, body: { old_password, new_password }, headers: { "x-stack-refresh-token": refreshToken } }) {
    if (!project.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    const passwordError = getPasswordError(new_password);
    if (passwordError) {
      throw passwordError;
    }

    await prismaClient.$transaction(async (tx) => {
      const prismaUser = await tx.projectUser.findUnique({
        where: {
          projectId_projectUserId: {
            projectId: project.id,
            projectUserId: user.id,
          },
        },
      });
      if (!prismaUser) {
        throw new StackAssertionError(
          "User not found in password update; it was probably deleted after the request started. We should put more thoughts into the transactions here",
        );
      }
      if (!prismaUser.passwordHash) {
        throw new KnownErrors.UserDoesNotHavePassword();
      }
      if (!(await comparePassword(old_password, prismaUser.passwordHash))) {
        throw new KnownErrors.PasswordConfirmationMismatch();
      }
      await tx.projectUser.update({
        where: {
          projectId_projectUserId: {
            projectId: project.id,
            projectUserId: user.id,
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
          ...(refreshToken
            ? {
                NOT: {
                  refreshToken: refreshToken[0],
                },
              }
            : {}),
        },
      });
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
