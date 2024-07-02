import nodemailer from 'nodemailer';
import { prismaClient } from '@/prisma-client';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { getProject } from '@/lib/projects';
import { UserJson, ProjectJson } from '@stackframe/stack-shared';
import { getEmailTemplateWithDefault } from '@/lib/email-templates';
import { renderEmailTemplate } from '@stackframe/stack-emails/dist/utils';
import { EmailTemplateType } from '@prisma/client';
import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { UsersCrud } from '@stackframe/stack-shared/dist/interface/crud/users';
import { filterUndefined } from '@stackframe/stack-shared/dist/utils/objects';


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
  user?: UsersCrud["Admin"]["Read"],
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

async function getDBInfo(projectId: string, projectUserId: string): Promise<{
  emailConfig: EmailConfig,
  project: ProjectJson,
  projectUser: UsersCrud["Admin"]["Read"],
}> {
  const project = await getProject(projectId);

  if (!project) {
    throw new Error('Project not found');
  }

  const user = await usersCrudHandlers.adminRead({
    project,
    userId: projectUserId,
  });

  return {
    emailConfig: await getEmailConfig(project),
    project,
    projectUser: user,
  };
}

export async function sendPasswordResetEmail(
  projectId: string,
  projectUserId: string,
  redirectUrl: string,
) {
  const { project, emailConfig, projectUser } = await getDBInfo(projectId, projectUserId);

  if (!projectUser.primary_email) {
    throw Error('The user does not have a primary email');
  }

  const resetCode = await prismaClient.projectUserPasswordResetCode.create({
    data: {
      projectId,
      projectUserId,
      code: generateSecureRandomString(),
      redirectUrl,
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // expires in 3 hours
    }
  });

  const passwordResetUrl = new URL(redirectUrl);
  passwordResetUrl.searchParams.append('code', resetCode.code);

  const template = await getEmailTemplateWithDefault(projectId, 'PASSWORD_RESET');
  const variables: Record<string, string | null> = {
    userDisplayName: projectUser.display_name,
    userPrimaryEmail: projectUser.primary_email,
    projectDisplayName: project.displayName,
    passwordResetLink: passwordResetUrl.toString(),
  };
  const { subject, html, text } = renderEmailTemplate(template.subject, template.content, variables);

  await sendEmail({
    emailConfig,
    to: projectUser.primary_email,
    subject,
    html,
    text,
  });
}
