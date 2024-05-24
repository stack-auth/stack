import { prismaClient } from "@/prisma-client";
import { EmailTemplateType } from "@prisma/client";
import { ReadonlyJson } from "@stackframe/stack-shared/dist/utils/json";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { getProject } from "./projects";
import { EditorBlockSchema, TEditorConfiguration } from "@/components/email-editor/documents/editor/core";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import RESET_PASSWORD from "@/components/email-editor/get-configuration/sample/reset-password";
import WELCOME from "@/components/email-editor/get-configuration/sample/welcome";

const defaultEmailTemplates: Record<EmailTemplateType, TEditorConfiguration> = {
  'EMAIL_VERIFICATION': RESET_PASSWORD,
  'PASSWORD_RESET': RESET_PASSWORD,
  'MAGIC_LINK': WELCOME,
};

export async function listEmailTemplates(projectId: string) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const templates = await prismaClient.emailTemplate.findMany({
    where: {
      projectConfigId: project.evaluatedConfig.id,
    },
  });
  const templateMap = new Map<EmailTemplateType, ReadonlyJson>();
  for (const template of templates) {
    templateMap.set(template.type, template.content as any);
  }

  const results: { type: EmailTemplateType, content: ReadonlyJson }[] = [];
  for (const type of Object.values(EmailTemplateType)) {
    const content = templateMap.get(type) ?? defaultEmailTemplates[type];
    results.push({ type, content: content as any });
  }

  return results;
}

export async function validateEmailTemplateContent(content: any) {
  try {
    for (const key of Object.keys(content)) {
      const block = content[key];
      EditorBlockSchema.parse(block);
    }
  } catch (e) {
    throw new StatusError(StatusError.BadRequest, "Invalid email template content format");
  }
}

export async function getEmailTemplate(projectId: string, type: EmailTemplateType) {
  return await updateEmailTemplate(projectId, type, {});
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
