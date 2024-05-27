import { EditorBlockSchema, TEditorConfiguration } from "@/components/email-editor/documents/editor/core";
import { typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import Mustache from 'mustache';
import { emailVerificationTemplate } from "./templates/email-verification";
import { passwordResetTemplate } from "./templates/password-reset";
import { magicLinkTemplate } from "./templates/magic-link";
import { render } from "@react-email/render";
import { Reader } from "@/components/email-editor/email-builder";
import { Body, Head, Html, Preview } from "@react-email/components";

const userVars = [
  { name: 'userDisplayName', label: 'User Display Name', defined: false, example: 'John Doe' },
  { name: 'userPrimaryEmail', label: 'User Primary Email', defined: true, example: 'example@email.com' },
] as const;

const projectVars = [
  { name: 'projectDisplayName', label: 'Project Name', defined: true, example: '{{ projectDisplayName }}' },
];

export type EmailTemplateVariable = {
  name: string,
  label: string,
  defined: boolean,
  example: string,
};

export type EmailTemplateMetadata = {
  label: string,
  description: string,
  defaultContent: TEditorConfiguration,
  defaultSubject: string,
  variables: EmailTemplateVariable[],
};

export const EMAIL_TEMPLATES_METADATA: Record<string, EmailTemplateMetadata> = {
  'EMAIL_VERIFICATION': {
    label: "Email Verification",
    description: "Will be sent to the user when they sign-up with email/password",
    defaultContent: emailVerificationTemplate,
    defaultSubject: "Verify your email at {{ projectDisplayName }}",
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'emailVerificationLink', label: 'Email Verification Link', defined: true, example: 'link' },
    ],
  },
  'PASSWORD_RESET': {
    label: "Password Reset",
    description: "Will be sent to the user when they request to reset their password (forgot password)",
    defaultContent: passwordResetTemplate,
    defaultSubject: "Reset your password at {{ projectDisplayName }}",
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'resetPasswordLink', label: 'Reset Password Link', defined: true, example: 'link' },
    ],
  },
  'MAGIC_LINK': {
    label: "Magic Link",
    description: "Will be sent to the user when they try to sign-up with magic link",
    defaultContent: magicLinkTemplate,
    defaultSubject: "Sign in to {{ projectDisplayName }}",
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'magicLink', label: 'Magic Link', defined: true, example: 'link' },
    ],
  },
} as const;

export function validateEmailTemplateContent(content: any): content is TEditorConfiguration {
  try {
    for (const key of Object.keys(content)) {
      const block = content[key];
      EditorBlockSchema.parse(block);
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

type NestedObject = { [key: string]: any };

export function objectStringMap<T extends NestedObject>(obj: T, func: (s: string) => string): T {
  function mapStrings(obj: NestedObject): NestedObject {
    const result: NestedObject = Array.isArray(obj) ? [] : {};
        
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
                
        if (typeof value === 'string') {
          result[key] = func(value);
        } else if (typeof value === 'object' && value !== null) {
          result[key] = mapStrings(value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  return mapStrings(obj) as T;
}

export function convertEmailTemplateMetadataExampleValues(
  metadata: EmailTemplateMetadata,
  project: { displayName: string },
): EmailTemplateMetadata {
  const variables = metadata.variables.map((variable) => {
    return {
      ...variable,
      example: Mustache.render(variable.example, { projectDisplayName: project.displayName }),
    };
  });
  return {
    ...metadata,
    variables,
  };
}

export function convertEmailTemplateVariables(
  content: TEditorConfiguration,
  variables: EmailTemplateVariable[],
): TEditorConfiguration {
  const vars = typedFromEntries(variables.map((variable) => [variable.name, variable.example]));
  return objectStringMap(content, (str) => {
    return Mustache.render(str, vars);
  });
}

export function convertEmailSubjectVariables(
  subject: string,
  variables: EmailTemplateVariable[],
): string {
  const vars = typedFromEntries(variables.map((variable) => [variable.name, variable.example]));
  return Mustache.render(subject, vars);
}

export function renderEmailTemplate(
  subject: string,
  content: TEditorConfiguration,
  variables: Record<string, string | null>,
) {
  const mergedTemplate = objectStringMap(content, (str) => {
    return Mustache.render(str, variables);
  });
  const mergedSubject = Mustache.render(subject, variables);

  const component = (    
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body>
        <Reader document={mergedTemplate} rootBlockId='root' />
      </Body>
    </Html>
  );
  const html = render(component);
  const text = render(component, { plainText: true });

  return { html, text, subject: mergedSubject };
}