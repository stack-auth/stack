import { EditorBlockSchema, TEditorConfiguration } from "@/components/email-editor/documents/editor/core";

export const EMAIL_TEMPLATES_INFO = {
  'EMAIL_VERIFICATION': {
    label: "Email Verification",
    description: "Will be sent to the user when they sign-up with email/password",
  },
  'PASSWORD_RESET': {
    label: "Password Reset",
    description: "Will be sent to the user when they request to reset their password (forgot password)",
  },
  'MAGIC_LINK': {
    label: "Magic Link",
    description: "Will be sent to the user when they try to sign-up with magic link",
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
