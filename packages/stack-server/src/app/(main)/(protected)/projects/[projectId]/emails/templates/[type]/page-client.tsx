'use client';

import EmailEditor from "@/components/email-editor/editor";
import { EmailEditorProvider } from "@/components/email-editor/editor-provider";
import RESET_PASSWORD from "@/components/email-editor/get-configuration/sample/reset-password";
import { useStackApp } from "@stackframe/stack";
import { EmailTemplateType } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { useAdminApp } from "../../../use-admin-app";
import { useRouter } from "next/navigation";

export default function PageClient(props: { templateType: EmailTemplateType }) {
  const app = useAdminApp();
  const emailTemplates = app.useEmailTemplates();
  const document = emailTemplates.find((template) => template.type === props.templateType);
  const router = useRouter();

  if (!document) {
    // this should not happen, the outer server component should handle this
    router.push("/404");
    return null;
  }

  return (
    <EmailEditorProvider>
      <EmailEditor document={document.content as any}/>
    </EmailEditorProvider>
  );
}