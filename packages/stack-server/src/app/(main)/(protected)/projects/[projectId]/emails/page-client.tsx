"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { FormSettingCard, SettingCard, SettingSwitch } from "@/components/settings";
import * as yup from "yup";
import { InputField, SelectField, SwitchField } from "@/components/form-fields";
import { TextTooltip } from "@/components/text-tooltip";
import { Info } from "lucide-react";

const emailServerSchema = yup.object({
  type: yup.string().oneOf(['shared', 'standard']).required(),
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

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Emails" description="Configure email settings for your project">
      <FormSettingCard
        title="Email Server"
        description="The server and address all the emails will be sent from"
        formSchema={emailServerSchema}
        defaultValues={{
          type: 'shared',
        }}
        onSubmit={async (values) => {
          // await project.update({
          //   emailConfig: values.shared ? null : values.emailConfig,
          // });
          console.log(values);
        }}
        render={(form) => <>
          <SelectField 
            label={<>
              Email server
              <TextTooltip text="When you use the shared email server, all the emails are sent from Stack's email address" />
            </>}
            name="type"
            control={form.control}
            options={[
              { label: "Shared (noreply@stack-auth.com)", value: 'shared' },
              { label: "Custom SMTP server (your own email address)", value: 'standard' },
            ]}
          />
          {form.watch('type') === 'standard' && <>
            <InputField 
              label="Host"
              name="emailConfig.host"
              control={form.control}
              required
            />
            <InputField 
              label="Port"
              name="emailConfig.port"
              control={form.control}
              required
            />
            <InputField 
              label="Username"
              name="emailConfig.username"
              control={form.control}
              required
            />
            <InputField 
              label="Password"
              name="emailConfig.password"
              control={form.control}
              required
            />
            <InputField 
              label="From Email"
              name="emailConfig.senderEmail"
              control={form.control}
              required
            />
          </>}
        </>}
      />
    </PageLayout>
  );
}
