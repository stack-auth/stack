import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { VerificationCodeType } from "@prisma/client";
import { sendEmailFromTemplate } from "@/lib/emails";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";

export const contactChannelVerificationCodeHandler = createVerificationCodeHandler({
  type: VerificationCodeType.CONTACT_CHANNEL_VERIFICATION,
  data: yup.object({
    user_id: yup.string().required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    body: yup.object({}).required(),
  }),
  async send(codeObj, createOptions, sendOptions: { user: UsersCrud["Admin"]["Read"] }) {
    await sendEmailFromTemplate({
      project: createOptions.project,
      user: sendOptions.user,
      email: createOptions.method.email,
      templateId: "EMAIL_VERIFICATION",
      extraVariables: {
        emailVerificationLink: codeObj.link.toString(),
      },
    });
  },
  async handler(project, { email }, data) {
    const updatedPrismaUser = await prismaClient.projectUser.update({
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

    return {
      statusCode: 200,
      body: {},
    };
  },
});
