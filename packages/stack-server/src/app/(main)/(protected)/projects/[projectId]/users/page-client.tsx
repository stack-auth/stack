"use client";

import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { Alert } from "@/components/ui/alert";
import { Link } from "@/components/link";
import { UserTable } from "@/components/data-table/user-table";


export default function UsersDashboardClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useServerUsers();

  return (
    <PageLayout title="Users" description="Manage your project's users">
      {allUsers.length > 0 ? null : (
        <Alert variant='success'>
          Congratulations on starting your project! Check the <Link href="https://docs.stack-auth.com">documentation</Link> to add your first users.
        </Alert>
      )}
      <UserTable users={allUsers} />
    </PageLayout>
  );
}
