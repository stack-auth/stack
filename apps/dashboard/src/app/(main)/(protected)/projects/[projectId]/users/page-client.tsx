"use client";

import { UserTable } from "@/components/data-table/user-table";
import { StyledLink } from "@/components/link";
import { Alert } from "@stackframe/stack-ui";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useUsers();

  return (
    <PageLayout title="Users">
      {allUsers.length > 0 ? null : (
        <Alert variant='success'>
          Congratulations on starting your project! Check the <StyledLink href="https://docs.stack-auth.com">documentation</StyledLink> to add your first users.
        </Alert>
      )}
      <UserTable users={allUsers} />
    </PageLayout>
  );
}
