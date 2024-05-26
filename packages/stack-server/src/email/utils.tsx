import { EditorBlockSchema, TEditorConfiguration } from "@/components/email-editor/documents/editor/core";


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
