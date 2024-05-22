'use client';

import EmailEditor from "@/components/email-editor/editor";
import { EmailEditorProvider } from "@/components/email-editor/editor-provider";

export default function PageClient() {
  return (
    <EmailEditorProvider>
      <EmailEditor />
    </EmailEditorProvider>
  );
}