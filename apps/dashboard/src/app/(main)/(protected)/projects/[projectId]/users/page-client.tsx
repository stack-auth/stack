"use client";

import { UserTable } from "@/components/data-table/user-table";
import { FormDialog } from "@/components/form-dialog";
import { InputField, SwitchField } from "@/components/form-fields";
import { StyledLink } from "@/components/link";
import { Alert, Button } from "@stackframe/stack-ui";
import * as yup from "yup";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";

function CreateDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
}) {
  const adminApp = useAdminApp();
  const formSchema = yup.object({
    displayName: yup.string().optional(),
    primaryEmail: yup.string().email().required(),
    primaryEmailVerified: yup.boolean().optional(),
    password: yup.string().required(),
  });

  return <FormDialog
    trigger={props.trigger}
    title={"Create User"}
    formSchema={formSchema}
    okButton={{ label: "Create" }}
    onSubmit={async (values) => {
      await adminApp.createUser(values);
    }}
    cancelButton
    render={(form) => (
      <>
        <InputField control={form.control} label="Display Name" name="displayName" />

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <InputField control={form.control} label="Primary Email" name="primaryEmail" required />
          </div>
          <div className="mb-2">
            <SwitchField control={form.control} label="Verified" name="primaryEmailVerified" />
          </div>
        </div>

        <InputField control={form.control} label="Password" name="password" type="password" required />
      </>
    )}
  />;
}


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useUsers();

  return (
    <PageLayout title="Users" actions={<CreateDialog trigger={<Button>Create User</Button>} />}>
      {allUsers.length > 0 ? null : (
        <Alert variant='success'>
          Congratulations on starting your project! Check the <StyledLink href="https://docs.stack-auth.com">documentation</StyledLink> to add your first users.
        </Alert>
      )}
      <UserTable users={allUsers} />
    </PageLayout>
  );
}
