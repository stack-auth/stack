"use client";

import { Paragraph } from "@/components/paragraph";
import { PermissionsTable } from "./permissions-table";
import { mockPermissions } from "./mock-permissions";
import { EnableTeam } from "../enable-team";
import { useAdminApp } from "../use-admin-app";


export default function ClientPage() {  
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissions();

  console.log(permissions);

  return (
    <>
      <Paragraph h1>
        Team Permissions
      </Paragraph>

      <EnableTeam>
        <PermissionsTable rows={mockPermissions as any} />
      </EnableTeam>
    </>
  );
}
