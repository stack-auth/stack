import nodemailer from 'nodemailer';
import VerificationEmail from './templates/verification';
import { prismaClient } from '@/prisma-client';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { generateSecureRandomString } from '@stackframe/stack-shared/dist/utils/crypto';
import { getProject } from '@/lib/projects';
import { render } from '@react-email/render';
import { UserJson, ProjectJson } from '@stackframe/stack-shared';
import { getClientUser } from '@/lib/users';
import PasswordResetEmail from './templates/password-reset';

export type EmailConfig = {
  host: string,
  port: number,
  username: string,
  password: string,
  senderEmail: string,
  senderName: string,
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
  text?: string,
  html: string,
}) {
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    // secure: true,
    secure: false,
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
      senderName: projectEmailConfig.senderName,
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

  const html = render(
    <VerificationEmail
      verificationUrl={verificationUrl.toString()}
      projectName={project.displayName}
      username={projectUser.displayName || undefined}
      fromStack={emailConfig.type === 'shared'}
    />
  );
  
  await sendEmail({
    emailConfig,
    to: projectUser.primaryEmail,
    subject: "Verify your email at " + project.displayName,
    html,
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

  const html = render(
    <PasswordResetEmail
      passwordResetUrl={passwordResetUrl.toString()}
      projectName={project.displayName}
      username={projectUser.displayName || undefined}
      fromStack={emailConfig.type === 'shared'}
    />
  );

  await sendEmail({
    emailConfig,
    to: projectUser.primaryEmail,
    subject: "Reset your password at " + project.displayName,
    html,
  });
}
