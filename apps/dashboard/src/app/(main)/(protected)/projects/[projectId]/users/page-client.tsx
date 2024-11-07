"use client";

import { UserTable } from "@/components/data-table/user-table";
import { FormDialog } from "@/components/form-dialog";
import { InputField, SwitchField, TextAreaField } from "@/components/form-fields";
import { StyledLink } from "@/components/link";
import { KnownErrors } from "@stackframe/stack-shared";
import { jsonStringOrEmptySchema } from "@stackframe/stack-shared/dist/schema-fields";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, Button, Typography, useToast } from "@stackframe/stack-ui";
import * as yup from "yup";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";

export function UserDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
}) {
  const { toast } = useToast();
  const adminApp = useAdminApp();
  const project = adminApp.useProject();

  const formSchema = yup.object({
    primaryEmail: yup.string().email("Primary Email must be a valid email address").required("Primary email is required"),
    displayName: yup.string().optional(),
    signedUpAt: yup.date().required(),
    clientMetadata: jsonStringOrEmptySchema.default("null"),
    clientReadOnlyMetadata: jsonStringOrEmptySchema.default("null"),
    serverMetadata: jsonStringOrEmptySchema.default("null"),
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
      primaryEmailAuthEnabled: true,
      clientMetadata: values.clientMetadata ? JSON.parse(values.clientMetadata) : undefined,
      clientReadOnlyMetadata: values.clientReadOnlyMetadata ? JSON.parse(values.clientReadOnlyMetadata) : undefined,
      serverMetadata: values.serverMetadata ? JSON.parse(values.serverMetadata) : undefined
    };

    try {
      await adminApp.createUser(userValues);
    } catch (error) {
      if (error instanceof KnownErrors.UserEmailAlreadyExists) {
        toast({
          title: "Email already exists",
          description: "Please choose a different email address",
          variant: "destructive",
        });
        return 'prevent-close';
      }
    }
  }

  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    trigger={props.trigger}
    title={"Create User"}
    formSchema={formSchema}
    okButton={{ label: "Create" }}
    render={(form) => (
      <>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <InputField control={form.control} label="Primary email" name="primaryEmail" required />
          </div>
          <div className="mb-2">
            <SwitchField control={form.control} label="Verified" name="primaryEmailVerified" />
          </div>
        </div>

        <InputField control={form.control} label="Display name" name="displayName" />

        {project.config.magicLinkEnabled && <SwitchField control={form.control} label="OTP/magic link sign-in" name="otpAuthEnabled" />}
        {project.config.credentialEnabled && <SwitchField control={form.control} label="Password sign-in" name="passwordEnabled" />}
        {form.watch("passwordEnabled") ? <InputField control={form.control} label={"Password"} name="password" type="password" /> : null}
        {!form.watch("primaryEmailVerified") && form.watch("otpAuthEnabled") && <Typography variant="secondary">Primary email must be verified if OTP/magic link sign-in is enabled</Typography>}

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Metadata</AccordionTrigger>
            <AccordionContent className="space-y-4">
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


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const users = stackAdminApp.useUsers();

  return (
    <PageLayout
      title="Users"
      actions={<UserDialog
        trigger={<Button>Create User</Button>}
      />}
    >
      {users.length > 0 ? null : (
        <Alert variant='success'>
          Congratulations on starting your project! Check the <StyledLink href="https://docs.stack-auth.com">documentation</StyledLink> to add your first users.
        </Alert>
      )}
      <UserTable />
    </PageLayout>
  );
}
