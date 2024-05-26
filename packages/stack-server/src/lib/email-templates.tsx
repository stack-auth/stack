import { prismaClient } from "@/prisma-client";
import { EmailTemplateType } from "@prisma/client";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { getProject } from "./projects";
import { TEditorConfiguration } from "@/components/email-editor/documents/editor/core";
import RESET_PASSWORD from "@/components/email-editor/get-configuration/sample/reset-password";
import WELCOME from "@/components/email-editor/get-configuration/sample/welcome";
import { EmailTemplateCrud, ListEmailTemplatesCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { EMAIL_TEMPLATES_INFO } from "@/email/utils";

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
  const templateMap = new Map<EmailTemplateType, {} | null>();
  for (const template of templates) {
    templateMap.set(template.type, template.content);
  }

  const results: ListEmailTemplatesCrud['Server']['Read'] = [];
  for (const type of Object.values(EmailTemplateType)) {
    const content = templateMap.get(type) ?? EMAIL_TEMPLATES_INFO[type].default;
    results.push({ type, content: content, default: !templateMap.has(type) });
  }

  return results;
}

export async function getEmailTemplate(projectId: string, type: EmailTemplateType) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  return await prismaClient.emailTemplate.findUnique({
    where: {
      projectConfigId_type: {
        projectConfigId: project.evaluatedConfig.id,
        type,
      },
    },
  });
}

export async function updateEmailTemplate(
  projectId: string, 
  type: EmailTemplateType, 
  update: Partial<EmailTemplateCrud['Server']['Update']>
) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  
  const result = await prismaClient.emailTemplate.update({
    where: {
      projectConfigId_type: {
        projectConfigId: project.evaluatedConfig.id,
        type,
      },
    },
    data: filterUndefined({
      content: update.content,
    }),
  });

  return {
    ...result,
    content: result.content as any,
  };
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

export async function createEmailTemplate(
  projectId: string, 
  type: EmailTemplateType, 
  data: EmailTemplateCrud['Server']['Update']
) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const result = await prismaClient.emailTemplate.create({
    data: {
      projectConfigId: project.evaluatedConfig.id,
      type,
      content: data.content,
    },
  });

  return {
    ...result,
    content: result.content as any,
  };
}
