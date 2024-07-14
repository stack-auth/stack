import nodemailer from 'nodemailer';
import { prismaClient } from '@/prisma-client';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { getProject } from '@/lib/projects';
import { ProjectJson } from '@stackframe/stack-shared';
import { EMAIL_TEMPLATES_METADATA, renderEmailTemplate } from '@stackframe/stack-emails/dist/utils';
import { EmailTemplateType } from '@prisma/client';
import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { UsersCrud } from '@stackframe/stack-shared/dist/interface/crud/users';
import { filterUndefined } from '@stackframe/stack-shared/dist/utils/objects';
import { TEditorConfiguration } from '@stackframe/stack-emails/dist/editor/documents/editor/core';

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

function getPortConfig(port: number | string) {
  let parsedPort = parseInt(port.toString());
  const secure = parsedPort === 465;
  return { secure };
}

export type EmailConfig = {
  host: string,
  port: number,
  username: string,
  password: string,
  senderEmail: string,
  senderName: string,
  secure: boolean,
  type: 'shared' | 'standard',
}

export async function sendEmail({
  emailConfig,
  to,
  subject,
  text,
  html,
}: {
  emailConfig: EmailConfig,
  to: string | string[],
  subject: string,
  html: string,
  text?: string,
}) {
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.username,
      pass: emailConfig.password,
    },
  });

  return await transporter.sendMail({
    from: `"${emailConfig.senderName}" <${emailConfig.senderEmail}>`,
    to,
    subject,
    text,
    html
  });
}

export async function sendEmailFromTemplate(options: {
  project: ProjectJson,
  user: UsersCrud["Admin"]["Read"] | null,
  email: string,
  templateId: EmailTemplateType,
  extraVariables: Record<string, string | null>,
}) {
  const template = await getEmailTemplateWithDefault(options.project.id, options.templateId);

  const variables = filterUndefined({
    projectDisplayName: options.project.displayName,
    userDisplayName: options.user?.display_name || undefined,
    userPrimaryEmail: options.user?.primary_email || undefined,
    ...filterUndefined(options.extraVariables),
  });
  const { subject, html, text } = renderEmailTemplate(template.subject, template.content, variables);
  
  await sendEmail({
    emailConfig: await getEmailConfig(options.project),
    to: options.email,
    subject,
    html,
    text,
  });   
}

async function getEmailConfig(project: ProjectJson): Promise<EmailConfig> {
  const projectEmailConfig = project.evaluatedConfig.emailConfig;
  if (!projectEmailConfig) {
    throw new Error('Email service config not found. TODO: When can this even happen?');
  }

  if (projectEmailConfig.type === 'shared') {
    return {
      host: getEnvVariable('STACK_EMAIL_HOST'),
      port: parseInt(getEnvVariable('STACK_EMAIL_PORT')),
      username: getEnvVariable('STACK_EMAIL_USERNAME'),
      password: getEnvVariable('STACK_EMAIL_PASSWORD'),
      senderEmail: getEnvVariable('STACK_EMAIL_SENDER'),
      senderName: project.displayName,
      secure: getPortConfig(getEnvVariable('STACK_EMAIL_PORT')).secure,
      type: 'shared',
    };
  } else {
    return {
      host: projectEmailConfig.host,
      port: projectEmailConfig.port,
      username: projectEmailConfig.username,
      password: projectEmailConfig.password,
      senderEmail: projectEmailConfig.senderEmail,
      senderName: projectEmailConfig.senderName,
      secure: getPortConfig(projectEmailConfig.port).secure,
      type: 'standard',
    };
  }
}
