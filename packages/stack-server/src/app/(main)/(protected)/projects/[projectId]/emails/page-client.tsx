"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingText } from "@/components/settings";
import * as yup from "yup";
import { InputField, SelectField } from "@/components/form-fields";
import { TextTooltip } from "@/components/text-tooltip";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/form-dialog";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();
  const emailConfig = project.evaluatedConfig?.emailConfig;

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
              <>Shared <TextTooltip text="When you use the shared email server, all the emails are sent from Stack's email address" /></> 
            }
          </div>
        </SettingText>
        <SettingText label="Address">
          {emailConfig?.type === 'standard' ? emailConfig.senderEmail : 'noreply@stack-auth.com'}
        </SettingText>
        <SettingText label="Sender name">
          {emailConfig?.senderName || project.displayName }
        </SettingText>
      </SettingCard>
    </PageLayout>
  );
}

function requiredWhenShared<S extends yup.AnyObject>(schema: S, message: string): S {
  return schema.when('shared', {
    is: 'false',
    then: (schema: S) => schema.required(message),
    otherwise: (schema: S) => schema.optional()
  });
}

const emailServerSchema = yup.object({
  type: yup.string().oneOf(['shared', 'standard']).required(),
  senderName: yup.string().required("Email sender name is required"),
  host: requiredWhenShared(yup.string(), "Host is required"),
  port: requiredWhenShared(yup.number(), "Port is required"),
  username: requiredWhenShared(yup.string(), "Username is required"),
  password: requiredWhenShared(yup.string(), "Password is required"),
  senderEmail: requiredWhenShared(yup.string().email("Sender email must be a valid email"), "Sender email is required"),
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
    defaultValues={{ type: project.evaluatedConfig?.emailConfig?.type || 'shared' }}
    okButton={{ label: "Save" }}
    onSubmit={async (values) => {
      console.log(values);
      if (values.type === 'shared') {
        await project.update({ 
          config: {
            emailConfig: { type: 'shared', senderName: values.senderName } 
          } 
        });
      } else {
        await project.update({ 
          config: { 
            emailConfig: { 
              type: 'standard', 
              senderName: values.senderName, 
              host: values.host || throwErr("This should never happen"),
              port: values.port || throwErr("This should never happen"),
              username: values.username || throwErr("This should never happen"),
              password: values.password || throwErr("This should never happen"),
              senderEmail: values.senderEmail || throwErr("This should never happen"),
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
        <InputField
          label="Email sender name"
          name="senderName"
          control={form.control}
          required
        />
        {form.watch('type') === 'standard' && <>
          {([
            { label: "Host", name: "host", type: 'text'},
            { label: "Port", name: "port", type: 'number'},
            { label: "Username", name: "username", type: 'text' },
            { label: "Password", name: "password", type: 'password' },
            { label: "Sender Email", name: "senderEmail", type: 'email' },
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
