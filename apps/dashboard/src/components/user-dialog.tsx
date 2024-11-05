import { useAdminApp } from "@/app/(main)/(protected)/projects/[projectId]/use-admin-app";
import { ServerUser } from "@stackframe/stack";
import { jsonStringOrEmptySchema } from "@stackframe/stack-shared/dist/schema-fields";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Typography } from "@stackframe/stack-ui";
import * as yup from "yup";
import { FormDialog } from "./form-dialog";
import { DateField, InputField, SwitchField, TextAreaField } from "./form-fields";

export function UserDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
} & ({
  type: 'create',
} | {
  type: 'edit',
  user: ServerUser,
})) {
  const adminApp = useAdminApp();
  const project = adminApp.useProject();

  let defaultValues;
  if (props.type === 'edit') {
    defaultValues = {
      displayName: props.user.displayName || undefined,
      primaryEmail: props.user.primaryEmail || undefined,
      primaryEmailVerified: props.user.primaryEmailVerified,
      signedUpAt: props.user.signedUpAt,
      clientMetadata: props.user.clientMetadata == null ? "" : JSON.stringify(props.user.clientMetadata, null, 2),
      serverMetadata: props.user.serverMetadata == null ? "" : JSON.stringify(props.user.serverMetadata, null, 2),
      passwordEnabled: props.user.hasPassword,
      otpAuthEnabled: props.user.otpAuthEnabled,
    };
  } else {
    defaultValues = {
      signedUpAt: new Date(),
    };
  }

  const formSchema = yup.object({
    displayName: yup.string().optional(),
    primaryEmail: yup.string().email("Primary Email must be a valid email address").required(),
    signedUpAt: yup.date().required(),
    clientMetadata: jsonStringOrEmptySchema.default("null"),
    serverMetadata: jsonStringOrEmptySchema.default("null"),
    clientReadOnlyMetadata: jsonStringOrEmptySchema.default("null"),
    primaryEmailVerified: yup.boolean().optional(),
    password: yup.string().optional(),
    otpAuthEnabled: yup.boolean().test({
      name: 'otp-verified',
      message: "Primary email must be verified if OTP/magic link sign-in is enabled",
      test: (value, context) => {
        return context.parent.primaryEmailVerified || !value;
      },
    }).optional(),
    passwordEnabled: yup.boolean().optional(),
  });

  async function handleSubmit(values: yup.InferType<typeof formSchema>) {
    const userValues = {
      ...values,
      clientMetadata: values.clientMetadata ? JSON.parse(values.clientMetadata) : undefined,
      serverMetadata: values.serverMetadata ? JSON.parse(values.serverMetadata) : undefined
    };

    if (props.type === 'edit') {
      await props.user.update(userValues);
    } else {
      await adminApp.createUser(userValues);
    }
  }

  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    trigger={props.trigger}
    title="Edit User"
    formSchema={formSchema}
    defaultValues={defaultValues}
    okButton={{ label: "Save" }}
    render={(form) => (
      <>
        {props.type === 'edit' ? <Typography variant='secondary'>ID: {props.user.id}</Typography> : null}
        <InputField control={form.control} label="Display Name" name="displayName" />

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <InputField control={form.control} label="Primary Email" name="primaryEmail" required />
          </div>
          <div className="mb-2">
            <SwitchField control={form.control} label="Verified" name="primaryEmailVerified" />
          </div>
        </div>

        <DateField control={form.control} label="Signed Up At" name="signedUpAt" />

        {project.config.magicLinkEnabled && <SwitchField control={form.control} label="OTP/magic link sign-in" name="otpAuthEnabled" />}
        {project.config.credentialEnabled && <SwitchField control={form.control} label="Password sign-in" name="passwordEnabled" />}
        {form.watch("passwordEnabled") ? <InputField control={form.control} label={props.type === 'edit' ? "New password (leave it empty to not update it)" : "Password"} name="password" type="password" /> : null}
        {!form.watch("primaryEmailVerified") && form.watch("otpAuthEnabled") && <Typography variant="secondary">Primary email must be verified if OTP/magic link sign-in is enabled</Typography>}

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Metadata</AccordionTrigger>
            <AccordionContent>
              <TextAreaField rows={3} control={form.control} label="Client metadata" name="clientMetadata" placeholder="null" monospace />
              <TextAreaField rows={3} control={form.control} label="Client read only metadata" name="clientReadOnlyMetadata" placeholder="null" monospace />
              <TextAreaField rows={3} control={form.control} label="Server metadata" name="serverMetadata" placeholder="null" monospace />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    )}
    onSubmit={handleSubmit}
    cancelButton
  />;
}
