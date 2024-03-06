"use client";

import { useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { UsersTable } from "./users-table";
import { useAdminApp } from "../../use-admin-app";


export default function UsersDashboardClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useServerUsers();

  return (
    <>
      <Paragraph h1>
        Users
      </Paragraph>

      <Paragraph body>
        <UsersTable rows={allUsers} />
      </Paragraph>
    </>
  );
}
