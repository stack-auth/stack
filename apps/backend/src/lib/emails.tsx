import { getProject } from '@/lib/projects';
import { prismaClient } from '@/prisma-client';
import { TEditorConfiguration } from '@stackframe/stack-emails/dist/editor/documents/editor/core';
import { EMAIL_TEMPLATES_METADATA, renderEmailTemplate } from '@stackframe/stack-emails/dist/utils';
import { ProjectsCrud } from '@stackframe/stack-shared/dist/interface/crud/projects';
import { UsersCrud } from '@stackframe/stack-shared/dist/interface/crud/users';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { StackAssertionError } from '@stackframe/stack-shared/dist/utils/errors';
import { filterUndefined } from '@stackframe/stack-shared/dist/utils/objects';
import { typedToUppercase } from '@stackframe/stack-shared/dist/utils/strings';
import nodemailer from 'nodemailer';
import { trace } from '@opentelemetry/api';
import { wait } from '@stackframe/stack-shared/dist/utils/promises';

export async function getEmailTemplate(projectId: string, type: keyof typeof EMAIL_TEMPLATES_METADATA) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const template = await prismaClient.emailTemplate.findUnique({
    where: {
      projectConfigId_type: {
        projectConfigId: project.config.id,
        type: typedToUppercase(type),
      },
    },
  });

  return template ? {
    ...template,
    content: template.content as TEditorConfiguration,
  } : null;
}

export async function getEmailTemplateWithDefault(projectId: string, type: keyof typeof EMAIL_TEMPLATES_METADATA, version: 1 | 2 = 2) {
  const template = await getEmailTemplate(projectId, type);
  if (template) {
    return template;
  }
  return {
    type,
    content: EMAIL_TEMPLATES_METADATA[type].defaultContent[version],
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
  await trace.getTracer('stackframe').startActiveSpan('sendEmail', async (span) => {
    try {
      const transporter = nodemailer.createTransport({
        logger: true,
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.username,
          pass: emailConfig.password,
        },
      });

      try {
        return await transporter.sendMail({
          from: `"${emailConfig.senderName}" <${emailConfig.senderEmail}>`,
          to,
          subject,
          text,
          html
        });
      } catch (error) {
        throw new StackAssertionError('Failed to send email', { error, host: emailConfig.host, from: emailConfig.senderEmail, to, subject });
      }
    } finally {
      span.end();
    }
  });
}

export async function sendEmailFromTemplate(options: {
  project: ProjectsCrud["Admin"]["Read"],
  user: UsersCrud["Admin"]["Read"] | null,
  email: string,
  templateType: keyof typeof EMAIL_TEMPLATES_METADATA,
  extraVariables: Record<string, string | null>,
  version?: 1 | 2,
}) {
  const template = await getEmailTemplateWithDefault(options.project.id, options.templateType, options.version);

  const variables = filterUndefined({
    projectDisplayName: options.project.display_name,
    userDisplayName: options.user?.display_name || undefined,
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

async function getEmailConfig(project: ProjectsCrud["Admin"]["Read"]): Promise<EmailConfig> {
  const projectEmailConfig = project.config.email_config;

  if (projectEmailConfig.type === 'shared') {
    return {
      host: getEnvVariable('STACK_EMAIL_HOST'),
      port: parseInt(getEnvVariable('STACK_EMAIL_PORT')),
      username: getEnvVariable('STACK_EMAIL_USERNAME'),
      password: getEnvVariable('STACK_EMAIL_PASSWORD'),
      senderEmail: getEnvVariable('STACK_EMAIL_SENDER'),
      senderName: project.display_name,
      secure: getPortConfig(getEnvVariable('STACK_EMAIL_PORT')).secure,
      type: 'shared',
    };
  } else {
    if (!projectEmailConfig.host || !projectEmailConfig.port || !projectEmailConfig.username || !projectEmailConfig.password || !projectEmailConfig.sender_email || !projectEmailConfig.sender_name) {
      throw new StackAssertionError("Email config is not complete despite not being shared. This should never happen?", { projectId: project.id, emailConfig: projectEmailConfig });
    }
    return {
      host: projectEmailConfig.host,
      port: projectEmailConfig.port,
      username: projectEmailConfig.username,
      password: projectEmailConfig.password,
      senderEmail: projectEmailConfig.sender_email,
      senderName: projectEmailConfig.sender_name,
      secure: getPortConfig(projectEmailConfig.port).secure,
      type: 'standard',
    };
  }
}
