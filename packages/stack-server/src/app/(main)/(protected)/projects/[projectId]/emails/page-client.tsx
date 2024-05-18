"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingText } from "@/components/settings";
import * as yup from "yup";
import { InputField, SelectField } from "@/components/form-fields";
import { TextTooltip } from "@/components/text-tooltip";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/form-dialog";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Emails" description="Configure email settings for your project">
      <SettingCard
        title="Email Server"
        description="The server and address all the emails will be sent from"
        actions={<EditEmailServerDialog trigger={<Button variant='secondary'>Configure</Button>} />}
      >
        <SettingText label="Email server">
          <div className="flex items-center gap-2">
            Shared <TextTooltip text="When you use the shared email server, all the emails are sent from Stack's email address" />
          </div>
        </SettingText>
        <SettingText label="Email address">
          noreply@stack-auth.com
        </SettingText>
        <SettingText label="Email sender name">
          {project.displayName}
        </SettingText>
      </SettingCard>
    </PageLayout>
  );
}

const emailServerSchema = yup.object({
  type: yup.string().oneOf(['shared', 'standard']).required(),
  emailSenderName: yup.string().required("Email sender name is required"),
  emailConfig: yup.object({
    host: yup.string().required("Host is required"),
    port: yup.number().required("Port is required"),
    username: yup.string().required("Username is required"),
    password: yup.string().required("Password is required"),
    senderEmail: yup.string().email("Sender email must be a valid email").required("Sender email is required"),
  }).when('shared', {
    is: 'false',
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.optional()
  }),
});

function EditEmailServerDialog(props: {
  trigger: React.ReactNode,
}) {
  return <FormDialog
    trigger={props.trigger}
    title="Edit Email Server"
    formSchema={emailServerSchema}
    defaultValues={{ type: 'shared' }}
    okButton={{ label: "Save" }}
    onSubmit={async (values) => { console.log(values); }}
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
        <InputField
          label="Email sender name"
          name="emailSenderName"
          control={form.control}
          required
        />
        {form.watch('type') === 'standard' && <>
          {([
            { label: "Host", name: "emailConfig.host", type: 'text'},
            { label: "Port", name: "emailConfig.port", type: 'number'},
            { label: "Username", name: "emailConfig.username", type: 'text' },
            { label: "Password", name: "emailConfig.password", type: 'password' },
            { label: "Sender Email", name: "emailConfig.senderEmail", type: 'email' },
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
