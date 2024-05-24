import { prismaClient } from "@/prisma-client";
import { EmailTemplateType } from "@prisma/client";
import { ReadonlyJson } from "@stackframe/stack-shared/dist/utils/json";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";

export async function getEmailTemplate(projectId: string, templateId: string) {
  return await updateEmailTemplate(projectId, templateId, {});
}

export async function listEmailTemplates(projectId: string) {
  return await prismaClient.emailTemplate.findMany({
    where: {
      projectConfigId: projectId,
    },
  });
}

export async function updateEmailTemplate(projectId: string, templateId: string, update: { content?: ReadonlyJson }) {
  return await prismaClient.emailTemplate.update({
    where: {
      id: templateId,
      projectConfigId: projectId,
    },
    data: filterUndefined({
      ...update,
      content: update.content as any,
    }),
  });
}

export async function deleteEmailTemplate(projectId: string, templateId: string) {
  return await prismaClient.emailTemplate.delete({
    where: {
      id: templateId,
      projectConfigId: projectId,
    },
  });
}

export async function createEmailTemplate(projectId: string, data: { content: ReadonlyJson, type: EmailTemplateType }) {
  return await prismaClient.emailTemplate.create({
    data: {
      projectConfigId: projectId,
      content: data.content as any,
      type: data.type,
    },
  });
}
