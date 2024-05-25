'use client';;
import EmailEditor from "@/components/email-editor/editor";
import { EmailEditorProvider } from "@/components/email-editor/editor-provider";
import { EmailTemplateType } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { useAdminApp } from "../../../use-admin-app";
import { usePathname, useRouter } from "next/navigation";
import { validateEmailTemplateContent } from "@/lib/utils";
import ErrorPage from "@/components/ui/error-page";

export default function PageClient(props: { templateType: EmailTemplateType }) {
  const app = useAdminApp();
  const emailTemplates = app.useEmailTemplates();
  const template = emailTemplates.find((template) => template.type === props.templateType);
  const router = useRouter();

  if (!template) {
    // this should not happen, the outer server component should handle this
    router.push("/404");
    return null;
  }
  
  if (!validateEmailTemplateContent(template.content)) {
    return <ErrorPage
      title="Invalid Template"
      description="The email template content is invalid"
      redirectUrl={`/projects/${app.projectId}`}
      redirectText="Go to dashboard"
    />;
  }

  return (
    <EmailEditorProvider>
      <EmailEditor document={template.content} />
    </EmailEditorProvider>
  );
}