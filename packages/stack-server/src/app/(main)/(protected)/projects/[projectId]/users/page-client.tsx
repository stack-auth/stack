"use client";

import { Paragraph } from "@/components/paragraph";
import { UsersTable } from "./users-table";
import { useAdminApp } from "../use-admin-app";
import { SmartLink } from "@/components/smart-link";
import { PageLayout } from "../page-layout";
import { Alert } from "@/components/ui/alert";


export default function UsersDashboardClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useServerUsers();

  return (
    <PageLayout title="Users" description="Manage your project's users">
      {allUsers.length > 0 ? null : (
        <Paragraph body>
          <Alert className="mb-4">
            Congratulations on starting your project! Check the <SmartLink href="https://docs.stack-auth.com">documentation</SmartLink> to add your first users.
          </Alert>
        </Paragraph>
      )}

      <Paragraph body>
        <UsersTable rows={allUsers} />
      </Paragraph>
    </PageLayout>
  );
}
