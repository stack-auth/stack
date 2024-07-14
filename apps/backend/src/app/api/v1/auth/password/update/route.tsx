import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { yupObject, clientOrHigherAuthTypeSchema, adaptSchema, yupString, yupNumber } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { comparePassword, hashPassword } from "@stackframe/stack-shared/dist/utils/password";

export const POST = createSmartRouteHandler({
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
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async handler({ auth: { project, user }, body: { old_password, new_password } }, fullReq) {
    if (!project.evaluatedConfig.credentialEnabled) {
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
        throw new StackAssertionError("User not found in password update; it was probably deleted after the request started. We should put more thoughts into the transactions here");
      }
      if (!prismaUser.passwordHash) {
        throw new KnownErrors.UserDoesNotHavePassword();
      }
      if (!await comparePassword(old_password, prismaUser.passwordHash)) {
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
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
