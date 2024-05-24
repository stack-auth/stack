import { prismaClient } from "@/prisma-client";
import { EmailTemplateType } from "@prisma/client";
import { ReadonlyJson } from "@stackframe/stack-shared/dist/utils/json";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { getProject } from "./projects";

export async function getEmailTemplate(projectId: string, type: EmailTemplateType) {
  return await updateEmailTemplate(projectId, type, {});
}

export async function listEmailTemplates(projectId: string) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  return await prismaClient.emailTemplate.findMany({
    where: {
      projectConfigId: project.evaluatedConfig.id,
    },
  });
}

export async function updateEmailTemplate(projectId: string, type: EmailTemplateType, update: { content?: ReadonlyJson }) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  
  return await prismaClient.emailTemplate.update({
    where: {
      projectConfigId_type: {
        projectConfigId: project.evaluatedConfig.id,
        type: type,
      },
    },
    data: filterUndefined({
      content: update.content as any,
    }),
  });
}

export async function deleteEmailTemplate(projectId: string, type: EmailTemplateType) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  return await prismaClient.emailTemplate.delete({
    where: {
      projectConfigId_type: {
        projectConfigId: project.evaluatedConfig.id,
        type: type,
      },
    },
  });
}

export async function createEmailTemplate(projectId: string, data: { content: ReadonlyJson, type: EmailTemplateType }) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  return await prismaClient.emailTemplate.create({
    data: {
      projectConfigId: project.evaluatedConfig.id,
      type: data.type,
      content: data.content as any,
    },
  });
}
