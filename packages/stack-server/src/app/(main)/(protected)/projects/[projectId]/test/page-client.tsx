'use client';

import EmailEditor from "@/components/email-editor/editor";
import { EmailEditorProvider } from "@/components/email-editor/editor-provider";
import RESET_PASSWORD from "@/components/email-editor/getConfiguration/sample/reset-password";

export default function PageClient() {
  return (
    <EmailEditorProvider>
      <EmailEditor document={RESET_PASSWORD}/>
    </EmailEditorProvider>
  );
}