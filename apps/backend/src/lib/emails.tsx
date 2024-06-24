import nodemailer from 'nodemailer';
import { prismaClient } from '@/prisma-client';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { getProject } from '@/lib/projects';
import { UserJson, ProjectJson } from '@stackframe/stack-shared';
import { getClientUser } from '@/lib/users';
import { getEmailTemplateWithDefault } from '@/lib/email-templates';
import { renderEmailTemplate } from '@stackframe/stack-emails/dist/utils';
import { EmailTemplateType } from '@prisma/client';
import { throwErr } from '@stackframe/stack-shared/dist/utils/errors';


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
  email: string,
  templateId: EmailTemplateType,
  variables: Record<string, string | null>,
}) {
  const template = await getEmailTemplateWithDefault(options.project.id, options.templateId);

  const { subject, html, text } = renderEmailTemplate(template.subject, template.content, options.variables);
  
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
      host: getEnvVariable('EMAIL_HOST'),
      port: parseInt(getEnvVariable('EMAIL_PORT')),
      username: getEnvVariable('EMAIL_USERNAME'),
      password: getEnvVariable('EMAIL_PASSWORD'),
      senderEmail: getEnvVariable('EMAIL_SENDER'),
      senderName: project.displayName,
      secure: getPortConfig(getEnvVariable('EMAIL_PORT')).secure,
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
  projectUser: UserJson,
}> {
  const project = await getProject(projectId);

  if (!project) {
    throw new Error('Project not found');
  }


  const projectUser = await getClientUser(projectId, projectUserId);

  if (!projectUser) {
    throw Error('User does not exist');
  }

  return {
    emailConfig: await getEmailConfig(project),
    project,
    projectUser,
  };
}

export async function sendVerificationEmail(
  projectId: string,
  projectUserId: string,
  redirectUrl: string,
) {
  const { project, emailConfig, projectUser } = await getDBInfo(projectId, projectUserId);

  if (!projectUser.primaryEmail) {
    throw Error('The user does not have a primary email');
  }

  if (projectUser.primaryEmailVerified) {
    throw Error('Email already verified');
  }

  const verificationCode = await prismaClient.projectUserEmailVerificationCode.create({
    data: {
      projectId,
      projectUserId,
      code: generateSecureRandomString(),
      redirectUrl,
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // expires in 3 hours
    }
  });

  const verificationUrl = new URL(redirectUrl);
  verificationUrl.searchParams.append('code', verificationCode.code);

  const template = await getEmailTemplateWithDefault(projectId, 'EMAIL_VERIFICATION');
  const variables: Record<string, string | null> = {
    userDisplayName: projectUser.displayName,
    userPrimaryEmail: projectUser.primaryEmail,
    projectDisplayName: project.displayName,
    emailVerificationLink: verificationUrl.toString(),
  };
  const { subject, html, text } = renderEmailTemplate(template.subject, template.content, variables);
  
  await sendEmail({
    emailConfig,
    to: projectUser.primaryEmail,
    subject,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(
  projectId: string,
  projectUserId: string,
  redirectUrl: string,
) {
  const { project, emailConfig, projectUser } = await getDBInfo(projectId, projectUserId);

  if (!projectUser.primaryEmail) {
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
    userDisplayName: projectUser.displayName,
    userPrimaryEmail: projectUser.primaryEmail,
    projectDisplayName: project.displayName,
    passwordResetLink: passwordResetUrl.toString(),
  };
  const { subject, html, text } = renderEmailTemplate(template.subject, template.content, variables);

  await sendEmail({
    emailConfig,
    to: projectUser.primaryEmail,
    subject,
    html,
    text,
  });
}
