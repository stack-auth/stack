import { prismaClient } from "@/prisma-client";
import { EmailTemplateType } from "@prisma/client";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { getProject } from "./projects";
import { EmailTemplateCrud, ListEmailTemplatesCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { EMAIL_TEMPLATES_METADATA } from "@/email/utils";
import { TEditorConfiguration } from "@/email/editor/documents/editor/core";

export async function listEmailTemplatesWithDefault(projectId: string) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const templates = await prismaClient.emailTemplate.findMany({
    where: {
      projectConfigId: project.evaluatedConfig.id,
    },
  });
  const templateMap = new Map<EmailTemplateType, { content: {}, subject: string }>();
  for (const template of templates) {
    templateMap.set(template.type, { content: template.content || {}, subject: template.subject });
  }

  const results: ListEmailTemplatesCrud['Server']['Read'] = [];
  for (const type of Object.values(EmailTemplateType)) {
    const template = templateMap.get(type) ?? { 
      content: EMAIL_TEMPLATES_METADATA[type].defaultContent, 
      subject: EMAIL_TEMPLATES_METADATA[type].defaultSubject 
    };
    results.push({ type, content: template.content, default: !templateMap.has(type), subject: template.subject });
  }

  return results;
}

export async function getEmailTemplateWithDefault(projectId: string, type: EmailTemplateType) {
  const template = await getEmailTemplate(projectId, type);
  if (template) {
    return template;
  }
  return {
    type,
    content: EMAIL_TEMPLATES_METADATA[type].defaultContent,
    subject: EMAIL_TEMPLATES_METADATA[type].defaultSubject,
    default: true,
  };
}

export async function getEmailTemplate(projectId: string, type: EmailTemplateType) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const template = await prismaClient.emailTemplate.findUnique({
    where: {
      projectConfigId_type: {
        projectConfigId: project.evaluatedConfig.id,
        type,
      },
    },
  });

  return template ? {
    ...template,
    content: template.content as TEditorConfiguration,
  } : null;
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
      subject: data.subject,
    },
  });

  return {
    ...result,
    content: result.content as any,
  };
}
