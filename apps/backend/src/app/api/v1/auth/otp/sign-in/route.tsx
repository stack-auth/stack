import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createAuthTokens } from "@/lib/tokens";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { signInResponseSchema } from "@stackframe/stack-shared/dist/schema-fields";

export const signInVerificationCodeHandler = createVerificationCodeHandler({
  data: yup.object({
    user_id: yup.string().required(),
    is_new_user: yup.boolean().required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    body: signInResponseSchema.required(),
  }),
  async handler(project, { email }, data) {
    const projectUser = await prismaClient.projectUser.update({
      where: {
        projectId_projectUserId: {
          projectId: project.id,
          projectUserId: data.user_id,
        },
        primaryEmail: email,
      },
      data: {
        primaryEmailVerified: true,
      },
    });

    const { refreshToken, accessToken } = await createAuthTokens({ 
      projectId: project.id,
      projectUserId: projectUser.projectUserId,
    });

    return {
      statusCode: 200,
      body: {
        refresh_token: refreshToken,
        access_token: accessToken,
        is_new_user: data.is_new_user,
        user_id: data.user_id,
      },
    };
  },
});

export const POST = signInVerificationCodeHandler.postHandler;
