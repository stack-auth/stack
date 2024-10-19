import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { adaptSchema, clientOrHigherAuthTypeSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { hashPassword } from "@stackframe/stack-shared/dist/utils/password";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Set password",
    description: "Set a new password for the current user",
    tags: ["Password"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
      user: adaptSchema.required(),
    }).required(),
    body: yupObject({
      password: yupString().required(),
    }).required(),
    headers: yupObject({}).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async handler({ auth: { project, user }, body: { password } }) {
    if (!project.config.credential_enabled) {
      throw new KnownErrors.PasswordAuthenticationNotEnabled();
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      throw passwordError;
    }

    await prismaClient.$transaction(async (tx) => {
      const authMethodConfig = await tx.passwordAuthMethodConfig.findMany({
        where: {
          projectConfigId: project.config.id,
          authMethodConfig: {
            enabled: true,
          },
        },
      });

      if (authMethodConfig.length > 1) {
        throw new StackAssertionError("Project has multiple password auth method configs.", { projectId: project.id });
      }

      if (authMethodConfig.length === 0) {
        throw new KnownErrors.PasswordAuthenticationNotEnabled();
      }

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
      } else if (authMethods.length === 1) {
        throw new StatusError(StatusError.BadRequest, "User already has a password set.");
      }

      await tx.authMethod.create({
        data: {
          projectId: project.id,
          projectUserId: user.id,
          projectConfigId: project.config.id,
          authMethodConfigId: authMethodConfig[0].authMethodConfigId,
          passwordAuthMethod: {
            create: {
              passwordHash: await hashPassword(password),
              projectUserId: user.id,
            }
          }
        }
      });
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
