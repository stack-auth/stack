"use client";

import { UserTable } from "@/components/data-table/user-table";
import { FormDialog } from "@/components/form-dialog";
import { InputField, SwitchField } from "@/components/form-fields";
import { StyledLink } from "@/components/link";
import { Alert, Button, Label, Switch } from "@stackframe/stack-ui";
import * as yup from "yup";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { useState } from "react";

function CreateDialog(props: {
  existingEmails: string[],
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
}) {
  const adminApp = useAdminApp();
  const project = adminApp.useProject();
  const formSchema = yup.object({
    displayName: yup.string().optional(),
    primaryEmail: yup.string().email().notOneOf(props.existingEmails, "Email already exists").required(),
    primaryEmailVerified: yup.boolean().optional().test({
      name: 'otp-verified',
      message: 'Primary email must be verified if OTP/magic link sign-in is enabled',
      test: (value, context) => {
        if (context.parent.otpAuthEnabled) {
          return !!value;
        }
        return true;
      },
    }).optional(),
    password: yup.string().optional(),
    otpAuthEnabled: yup.boolean().optional(),
    passwordEnabled: yup.boolean().optional(),
  });

  return <FormDialog
    trigger={props.trigger}
    title={"Create User"}
    formSchema={formSchema}
    okButton={{ label: "Create" }}
    onSubmit={async (values) => {
      await adminApp.createUser({
        ...values,
        primaryEmailAuthEnabled: true,
      });
    }}
    cancelButton
    render={(form) => (
      <>
        <InputField control={form.control} label="Display name" name="displayName" />
        <InputField control={form.control} label="Primary email" name="primaryEmail" required />
        <SwitchField control={form.control} label="Primary email verified" name="primaryEmailVerified" />
        {project.config.magicLinkEnabled && <SwitchField control={form.control} label="OTP/magic link sign-in" name="otpAuthEnabled" />}
        {project.config.credentialEnabled && <SwitchField control={form.control} label="Password sign-in" name="passwordEnabled" />}
        {form.watch("passwordEnabled") ? <InputField control={form.control} label="Password" name="password" type="password" /> : null}
      </>
    )}
  />;
}


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useUsers();

  return (
    <PageLayout
      title="Users"
      actions={<CreateDialog
        trigger={<Button>Create User</Button>}
        existingEmails={allUsers.map(u => u.primaryEmail).filter(e => e !== null) as string[]}
      />}
    >
      {allUsers.length > 0 ? null : (
        <Alert variant='success'>
          Congratulations on starting your project! Check the <StyledLink href="https://docs.stack-auth.com">documentation</StyledLink> to add your first users.
        </Alert>
      )}
      <UserTable users={allUsers} />
    </PageLayout>
  );
}
