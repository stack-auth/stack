"use client";

import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingText } from "@/components/settings";
import * as yup from "yup";
import { InputField, SelectField } from "@/components/form-fields";
import { SimpleTooltip } from "@/components/simple-tooltip";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/form-dialog";
import { EmailConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { Project } from "@stackframe/stack";
import { Reader } from "@stackframe/stack-emails/dist/editor/email-builder/index";
import { Card } from "@/components/ui/card";
import Typography from "@/components/ui/typography";
import { ActionCell } from "@/components/data-table/elements/cells";
import { useRouter } from "@/components/router";
import { EMAIL_TEMPLATES_METADATA, convertEmailSubjectVariables, convertEmailTemplateMetadataExampleValues, convertEmailTemplateVariables } from "@stackframe/stack-emails/dist/utils";
import { useMemo, useState } from "react";
import { validateEmailTemplateContent } from "@stackframe/stack-emails/dist/utils";
import { EmailTemplateType } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { ActionDialog } from "@/components/action-dialog";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();
  const emailConfig = project.evaluatedConfig.emailConfig;
  const emailTemplates = stackAdminApp.useEmailTemplates();
  const router = useRouter();
  const [resetTemplateType, setResetTemplateType] = useState<EmailTemplateType>("EMAIL_VERIFICATION");
  const [resetTemplateDialogOpen, setResetTemplateDialogOpen] = useState(false);

  return (
    <PageLayout title="Emails" description="Configure email settings for your project">
      <SettingCard
        title="Email Server"
        description="The server and address all the emails will be sent from"
        actions={<EditEmailServerDialog trigger={<Button variant='secondary'>Configure</Button>} />}
      >
        <SettingText label="Server">
          <div className="flex items-center gap-2">
            { emailConfig?.type === 'standard' ? 
              'Custom SMTP server' : 
              <>Shared <SimpleTooltip tooltip="When you use the shared email server, all the emails are sent from Stack's email address" type='info' /></>
            }
          </div>
        </SettingText>
        <SettingText label="Sender Email">
          {emailConfig?.type === 'standard' ? emailConfig.senderEmail : 'noreply@stack-auth.com'}
        </SettingText>
      </SettingCard>

      <SettingCard title="Email Templates" description="Customize the emails sent">
        {emailTemplates.map((template) => (
          <Card key={template.type} className="p-4 flex justify-between flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2">
              <div>
                <Typography className="font-medium">
                  {EMAIL_TEMPLATES_METADATA[template.type].label}
                </Typography>
                <Typography type='label' variant='secondary'>
                  Subject: <SubjectPreview subject={template.subject} type={template.type} />
                </Typography>
              </div>
              <div className="flex-grow flex justify-start items-end gap-2">
                <Button variant='secondary' onClick={() => router.push('emails/templates/' + template.type)}>Edit Template</Button>
                {!template.default && <ActionCell
                  dangerItems={[{
                    item: 'Reset to Default',
                    onClick: () => {
                      setResetTemplateType(template.type);
                      setResetTemplateDialogOpen(true);
                    }
                  }]}
                />}
              </div>
            </div>
            <EmailPreview content={template.content} type={template.type} />
          </Card>
        ))}
      </SettingCard>

      <ResetEmailTemplateDialog 
        templateType={resetTemplateType} 
        open={resetTemplateDialogOpen} 
        onClose={() => setResetTemplateDialogOpen(false)}
      />
    </PageLayout>
  );
}

function EmailPreview(props: { content: any, type: EmailTemplateType }) {
  const project = useAdminApp().useProjectAdmin();
  const [valid, document] = useMemo(() => {
    const valid = validateEmailTemplateContent(props.content);
    if (!valid) return [false, null];

    const metadata = convertEmailTemplateMetadataExampleValues(EMAIL_TEMPLATES_METADATA[props.type], project.displayName);
    const document = convertEmailTemplateVariables(props.content, metadata.variables);
    return [true, document];
  }, [props.content, props.type, project]);

  let reader;
  if (valid && document) {
    reader = (
      <div className="scale-50 w-[400px] origin-top-left">
        <Reader document={document} rootBlockId='root' />
      </div>
    );
  } else {
    reader = <div className="flex items-center justify-center h-full text-red-500">Invalid template</div>;
  }

  return (
    <div className="max-h-[150px] min-h-[150px] max-w-[200px] sm:min-w-[200px] overflow-hidden rounded border" inert=''>
      <div className="absolute inset-0 bg-transparent z-10"/>
      {reader}
    </div>
  );
}

function SubjectPreview(props: { subject: string, type: EmailTemplateType }) {
  const project = useAdminApp().useProjectAdmin();
  const subject = useMemo(() => {
    const metadata = convertEmailTemplateMetadataExampleValues(EMAIL_TEMPLATES_METADATA[props.type], project.displayName);
    return convertEmailSubjectVariables(props.subject, metadata.variables);
  }, [props.subject, props.type, project]);
  return subject;
}

function requiredWhenShared<S extends yup.AnyObject>(schema: S, message: string): S {
  return schema.when('shared', {
    is: 'false',
    then: (schema: S) => schema.required(message),
    otherwise: (schema: S) => schema.optional()
  });
}

const getDefaultValues = (emailConfig: EmailConfigJson | undefined, project: Project) => {
  if (!emailConfig) {
    return { type: 'shared', senderName: project.displayName } as const;
  } else if (emailConfig.type === 'shared') {
    return { type: 'shared' } as const;
  } else {
    return { 
      type: 'standard', 
      senderName: emailConfig.senderName, 
      host: emailConfig.host,
      port: emailConfig.port,
      username: emailConfig.username,
      password: emailConfig.password,
      senderEmail: emailConfig.senderEmail,
    } as const;
  }
};

const emailServerSchema = yup.object({
  type: yup.string().oneOf(['shared', 'standard']).required(),
  host: requiredWhenShared(yup.string(), "Host is required"),
  port: requiredWhenShared(yup.number(), "Port is required"),
  username: requiredWhenShared(yup.string(), "Username is required"),
  password: requiredWhenShared(yup.string(), "Password is required"),
  senderEmail: requiredWhenShared(yup.string().email("Sender email must be a valid email"), "Sender email is required"),
  senderName: requiredWhenShared(yup.string(), "Email sender name is required"),
});

function EditEmailServerDialog(props: {
  trigger: React.ReactNode,
}) {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return <FormDialog
    trigger={props.trigger}
    title="Edit Email Server"
    formSchema={emailServerSchema}
    defaultValues={getDefaultValues(project.evaluatedConfig.emailConfig, project)}
    okButton={{ label: "Save" }}
    onSubmit={async (values) => {
      if (values.type === 'shared') {
        await project.update({ 
          config: {
            emailConfig: { type: 'shared' } 
          } 
        });
      } else {
        await project.update({ 
          config: { 
            emailConfig: { 
              type: 'standard', 
              senderName: values.senderName!, 
              host: values.host!,
              port: values.port!,
              username: values.username!,
              password: values.password!,
              senderEmail: values.senderEmail!,
            } 
          } 
        });
      }
    }}
    cancelButton
    render={(form) => (
      <>
        <SelectField 
          label="Email server"
          name="type"
          control={form.control}
          options={[
            { label: "Shared (noreply@stack-auth.com)", value: 'shared' },
            { label: "Custom SMTP server (your own email address)", value: 'standard' },
          ]}
        />
        {form.watch('type') === 'standard' && <>
          {([
            { label: "Host", name: "host", type: 'text'},
            { label: "Port", name: "port", type: 'number'},
            { label: "Username", name: "username", type: 'text' },
            { label: "Password", name: "password", type: 'password' },
            { label: "Sender Email", name: "senderEmail", type: 'email' },
            { label: "Sender Name", name: "senderName", type: 'text' },
          ] as const).map((field) => (
            <InputField 
              key={field.name}
              label={field.label}
              name={field.name}
              control={form.control}
              type={field.type}
              required
            />
          ))}
        </>}
      </>
    )}
  />;
}

function ResetEmailTemplateDialog(props: {
  open?: boolean,
  onClose?: () => void,
  templateType: EmailTemplateType,
}) {
  const stackAdminApp = useAdminApp();
  return <ActionDialog
    danger
    open={props.open}
    onClose={props.onClose}
    title="Reset Email Template"
    okButton={{ 
      label: "Reset", 
      onClick: async () => { await stackAdminApp.resetEmailTemplate(props.templateType); }
    }}
    confirmText="I understand this cannot be undone"
  >
    Are you sure you want to reset the email template to the default? You will lose all the changes you have made.
  </ActionDialog>;
}
