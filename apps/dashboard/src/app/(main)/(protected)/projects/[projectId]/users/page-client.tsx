"use client";

import { UserTable } from "@/components/data-table/user-table";
import { FormDialog } from "@/components/form-dialog";
import { InputField, SwitchField } from "@/components/form-fields";
import { StyledLink } from "@/components/link";
import { Alert, Button } from "@stackframe/stack-ui";
import * as yup from "yup";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { UserDialog } from "@/components/user-dialog";


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const users = stackAdminApp.useUsers();

  return (
    <PageLayout
      title="Users"
      actions={<UserDialog
        type="create"
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
