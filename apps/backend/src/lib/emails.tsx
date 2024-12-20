import { getProject } from '@/lib/projects';
import { prismaClient } from '@/prisma-client';
import { trace } from '@opentelemetry/api';
import { TEditorConfiguration } from '@stackframe/stack-emails/dist/editor/documents/editor/core';
import { EMAIL_TEMPLATES_METADATA, renderEmailTemplate } from '@stackframe/stack-emails/dist/utils';
import { ProjectsCrud } from '@stackframe/stack-shared/dist/interface/crud/projects';
import { UsersCrud } from '@stackframe/stack-shared/dist/interface/crud/users';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import { StackAssertionError } from '@stackframe/stack-shared/dist/utils/errors';
import { filterUndefined } from '@stackframe/stack-shared/dist/utils/objects';
import { Result } from '@stackframe/stack-shared/dist/utils/results';
import { typedToUppercase } from '@stackframe/stack-shared/dist/utils/strings';
import nodemailer from 'nodemailer';

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

export function isSecureEmailPort(port: number | string) {
  let parsedPort = parseInt(port.toString());
  return parsedPort === 465;
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

type SendEmailOptions = {
  emailConfig: EmailConfig,
  to: string | string[],
  subject: string,
  html?: string,
  text?: string,
}

export async function sendEmailWithKnownErrorTypes(options: SendEmailOptions): Promise<Result<undefined, {
  rawError: any,
  errorType: 'UNKNOWN' | 'HOST_NOT_FOUND' | 'AUTH_FAILED' | 'SOCKET_CLOSED' | 'TEMPORARY' | 'INVALID_EMAIL_ADDRESS',
  retryable: boolean,
  message?: string,
}>> {
  try {
    const transporter = nodemailer.createTransport({
      host: options.emailConfig.host,
      port: options.emailConfig.port,
      secure: options.emailConfig.secure,
      auth: {
        user: options.emailConfig.username,
        pass: options.emailConfig.password,
      },
    });

    await transporter.sendMail({
      from: `"${options.emailConfig.senderName}" <${options.emailConfig.senderEmail}>`,
      ...options,
    });

    return Result.ok(undefined);
  } catch (error) {
    if (error instanceof Error) {
      const code = (error as any).code as string | undefined;
      const responseCode = (error as any).responseCode as number | undefined;
      const errorNumber = (error as any).errno as number | undefined;

      const getServerResponse = (error: any) => {
        if (error.response) {
          return `\nResponse from the email server:\n${error.response}`;
        }
        return '';
      };

      if (errorNumber === -3008 || code === 'EDNS') {
        return Result.error({
          rawError: error,
          errorType: 'HOST_NOT_FOUND',
          retryable: false,
          message: 'Failed to connect to the email host. Please make sure the email host configuration is correct.'
        });
      }

      if (responseCode === 535 || code === 'EAUTH') {
        return Result.error({
          rawError: error,
          errorType: 'AUTH_FAILED',
          retryable: false,
          message: 'Failed to authenticate with the email server. Please check your email credentials configuration.',
        });
      }

      if (responseCode === 450) {
        return Result.error({
          rawError: error,
          errorType: 'TEMPORARY',
          retryable: true,
          message: 'The email server returned a temporary error. This could be due to a temporary network issue or a temporary block on the email server. Please try again later.\n\nError: ' + getServerResponse(error),
        });
      }

      if (responseCode === 553) {
        return Result.error({
          rawError: error,
          errorType: 'INVALID_EMAIL_ADDRESS',
          retryable: false,
          message: 'The email address provided is invalid. Please verify both the recipient and sender email addresses configuration are correct.\n\nError:' + getServerResponse(error),
        });
      }

      if (error.message.includes('Unexpected socket close')) {
        return Result.error({
          rawError: error,
          errorType: 'SOCKET_CLOSED',
          retryable: false,
          message: 'Connection to email server was lost unexpectedly. This could be due to incorrect email server port configuration or a temporary network issue. Please verify your configuration and try again.',
        });
      }
    }

    // ============ temporary error ============
    const temporaryErrorIndicators = [
      "450 ",
      "Client network socket disconnected before secure TLS connection was established",
      "Too many requests",
      ...options.emailConfig.host.includes("resend") ? [
        // Resend is a bit unreliable, so we'll retry even in some cases where it may send duplicate emails
        "ECONNRESET",
      ] : [],
    ];
    if (temporaryErrorIndicators.some(indicator => error instanceof Error && error.message.includes(indicator))) {
      // this can happen occasionally (especially with certain unreliable email providers)
      // so let's retry
      return Result.error({
        rawError: error,
        errorType: 'UNKNOWN',
        retryable: true,
        message: 'Failed to send email, but error is possibly transient due to the internet connection. Please check your email configuration and try again later.',
      });
    }

    // ============ unknown error ============
    return Result.error({
      rawError: error,
      errorType: 'UNKNOWN',
      retryable: false,
      message: 'An unknown error occurred while sending the email.',
    });
  }
}

export async function sendEmail({
  emailConfig,
  to,
  subject,
  text,
  html,
}: SendEmailOptions) {
  await trace.getTracer('stackframe').startActiveSpan('sendEmail', async (span) => {
    try {
      return Result.orThrow(await Result.retry(async (attempt) => {
        const result = await sendEmailWithKnownErrorTypes({ emailConfig, to, subject, text, html });

        if (result.status === 'error') {
          const extraData = { host: emailConfig.host, from: emailConfig.senderEmail, to, subject, cause: result.error.rawError };

          if (result.error.retryable) {
            console.warn("Failed to send email, but error is possibly transient so retrying.", extraData, result.error.rawError);
            return Result.error(result.error);
          }

          // TODO if using custom email config, we should notify the developer instead of throwing an error
          throw new StackAssertionError('Failed to send email', extraData);
        }

        return result;
      }, 3, { exponentialDelayBase: 2000 }));
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
      secure: isSecureEmailPort(getEnvVariable('STACK_EMAIL_PORT')),
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
      secure: isSecureEmailPort(projectEmailConfig.port),
      type: 'standard',
    };
  }
}
