import { EditorBlockSchema, TEditorConfiguration } from "@/components/email-editor/documents/editor/core";
import RESET_PASSWORD from "@/components/email-editor/get-configuration/sample/reset-password";
import WELCOME from "@/components/email-editor/get-configuration/sample/welcome";
import { typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import Mustache from 'mustache';

const userVars = [
  { name: 'user.displayName', label: 'User Display Name', defined: false, example: 'John Doe', editableExample: true },
  { name: 'user.primaryEmail', label: 'User Primary Email', defined: true, example: 'example@email.com', editableExample: true },
] as const;

const projectVars = [
  { name: 'project.displayName', label: 'Project Name', defined: true, example: '{{ project.displayName }}', editableExample: false },
];

export type EmailTemplateVariable = {
  name: string,
  label: string,
  defined: boolean,
  example: string,
  editableExample: boolean,
};

export type EmailTemplateMetadata = {
  label: string,
  description: string,
  default: TEditorConfiguration,
  variables: EmailTemplateVariable[],
};

export const EMAIL_TEMPLATES_METADATA: Record<string, EmailTemplateMetadata> = {
  'EMAIL_VERIFICATION': {
    label: "Email Verification",
    description: "Will be sent to the user when they sign-up with email/password",
    default: RESET_PASSWORD,
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'emailVerificationLink', label: 'Email Verification Link', defined: true, example: 'link', editableExample: false },
    ],
  },
  'PASSWORD_RESET': {
    label: "Password Reset",
    description: "Will be sent to the user when they request to reset their password (forgot password)",
    default: RESET_PASSWORD,
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'resetPasswordLink', label: 'Reset Password Link', defined: true, example: 'link', editableExample: false },
    ],
  },
  'MAGIC_LINK': {
    label: "Magic Link",
    description: "Will be sent to the user when they try to sign-up with magic link",
    default: WELCOME,
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'magicLink', label: 'Magic Link', defined: true, example: 'link', editableExample: false },
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
      example: Mustache.render(variable.example, { project }),
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