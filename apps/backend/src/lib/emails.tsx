import nodemailer from 'nodemailer';
import { prismaClient } from '@/prisma-client';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { getProject } from '@/lib/projects';
import { UserJson, ProjectJson } from '@stackframe/stack-shared';
import { getClientUser } from '@/lib/users';
import { getEmailTemplateWithDefault } from '@/lib/email-templates';
import { renderEmailTemplate } from '@stackframe/stack-emails/dist/utils';


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

async function getDBInfo(projectId: string, projectUserId: string): Promise<{
  emailConfig: EmailConfig,
  project: ProjectJson,
  projectUser: UserJson,
}> {
  const project = await getProject(projectId);

  if (!project) {
    throw new Error('Project not found');
  }

  const projectEmailConfig = project.evaluatedConfig.emailConfig;
  if (!projectEmailConfig) {
    throw new Error('Email service config not found');
  }

  let emailConfig: EmailConfig;
  if (projectEmailConfig.type === 'shared') {
    emailConfig = {
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
    emailConfig = {
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

  const projectUser = await getClientUser(projectId, projectUserId);

  if (!projectUser) {
    throw Error('User does not exist');
  }

  return {
    emailConfig,
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

export async function sendMagicLink(
  projectId: string,
  projectUserId: string,
  redirectUrl: string,
  newUser: boolean,
) {
  const { project, emailConfig, projectUser } = await getDBInfo(projectId, projectUserId);

  if (!projectUser.primaryEmail) {
    throw Error('The user does not have a primary email');
  }

  const magicLinkCode = await prismaClient.projectUserMagicLinkCode.create({
    data: {
      projectId,
      projectUserId,
      code: generateSecureRandomString(),
      redirectUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // expires in 30 min
      newUser,
    }
  });

  const magicLink = new URL(redirectUrl);
  magicLink.searchParams.append('code', magicLinkCode.code);

  const template = await getEmailTemplateWithDefault(projectId, 'MAGIC_LINK');
  const variables: Record<string, string | null> = {
    userDisplayName: projectUser.displayName,
    userPrimaryEmail: projectUser.primaryEmail,
    projectDisplayName: project.displayName,
    magicLink: magicLink.toString(),
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
