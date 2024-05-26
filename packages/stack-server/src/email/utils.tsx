import { EditorBlockSchema, TEditorConfiguration } from "@/components/email-editor/documents/editor/core";
import RESET_PASSWORD from "@/components/email-editor/get-configuration/sample/reset-password";
import WELCOME from "@/components/email-editor/get-configuration/sample/welcome";
import Mustache from 'mustache';

const userVars = [
  { name: 'user.displayName', label: 'User Display Name', required: false, example: 'John Doe' },
  { name: 'user.primaryEmail', label: 'User Primary Email', required: true, example: 'example@email.com' },
] as const;

const projectVars = [
  { name: 'project.displayName', label: 'Project Name', required: true, example: '{{ project.displayName }}' },
];

export const EMAIL_TEMPLATES_INFO = {
  'EMAIL_VERIFICATION': {
    label: "Email Verification",
    description: "Will be sent to the user when they sign-up with email/password",
    default: RESET_PASSWORD,
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'emailVerificationLink', label: 'Email Verification Link', required: true, example: '{{ emailVerificationLink }}' },
    ],
  },
  'PASSWORD_RESET': {
    label: "Password Reset",
    description: "Will be sent to the user when they request to reset their password (forgot password)",
    default: RESET_PASSWORD,
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'resetPasswordLink', label: 'Reset Password Link', required: true, example: '{{ resetPasswordLink }}' },
    ],
  },
  'MAGIC_LINK': {
    label: "Magic Link",
    description: "Will be sent to the user when they try to sign-up with magic link",
    default: WELCOME,
    variables: [
      ...userVars,
      ...projectVars,
      { name: 'magicLink', label: 'Magic Link', required: true, example: '{{ magicLink }}' },
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

export function convertEmailTemplateVariables(content: any, vars: Record<string, string>): any {
  return objectStringMap(content, (str) => {
    return Mustache.render(str, vars);
  });
}