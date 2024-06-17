'use client';
import EmailEditor from "@/components/email-editor/editor";
import { EmailTemplateType } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { useAdminApp } from "../../../use-admin-app";
import { useRouter } from "@/components/router";
import { EMAIL_TEMPLATES_METADATA, validateEmailTemplateContent } from "@/email/utils";
import ErrorPage from "@/components/ui/error-page";
import { TEditorConfiguration } from "@/components/email-editor/documents/editor/core";
import { useToast } from "@/components/ui/use-toast";

export default function PageClient(props: { templateType: EmailTemplateType }) {
  const app = useAdminApp();
  const emailTemplates = app.useEmailTemplates();
  const template = emailTemplates.find((template) => template.type === props.templateType);
  const router = useRouter();
  const { toast } = useToast();

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

  const onSave = async (document: TEditorConfiguration, subject: string) => {
    await app.updateEmailTemplate(props.templateType, { content: document, subject });
    toast({ title: "Email template saved" });
  };

  const onCancel = () => {
    router.push(`/projects/${app.projectId}/emails`);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <EmailEditor 
        document={template.content} 
        subject={template.subject}
        metadata={EMAIL_TEMPLATES_METADATA[props.templateType]}
        onSave={onSave} 
        onCancel={onCancel} 
      />
    </div>
  );
}