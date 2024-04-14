"use client";

import { Paragraph } from "@/components/paragraph";
import { UsersTable } from "./users-table";
import { useAdminApp } from "../../use-admin-app";
import { Alert } from "@mui/joy";
import { SmartLink } from "@/components/smart-link";


export default function UsersDashboardClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useServerUsers();

  return (
    <>
      <Paragraph h1>
        Users
      </Paragraph>


      {allUsers.length > 0 ? null : (
        <Paragraph body>
          <Alert color="success">
            Congratulations on starting your project! Check the <SmartLink href="https://docs.stack-auth.com">documentation</SmartLink> to add your first users.
          </Alert>
        </Paragraph>
      )}

      <Paragraph body>
        <UsersTable rows={allUsers} />
      </Paragraph>
    </>
  );
}
