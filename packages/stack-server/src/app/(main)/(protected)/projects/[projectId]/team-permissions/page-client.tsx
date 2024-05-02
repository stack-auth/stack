"use client";

import { Paragraph } from "@/components/paragraph";
import { PermissionsTable } from "./permissions-table";
import { mockPermissions } from "./mock-permissions";
import { EnableTeam } from "../enable-team";
import { useAdminApp } from "../use-admin-app";
import { AsyncButton } from "@/components/async-button";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissions();

  return (
    <>
      <Paragraph h1>
        Team Permissions
      </Paragraph>

      <AsyncButton
        onClick={async () => await stackAdminApp.createPermission({
          id: (Math.random() * 1000).toString(),
          description: "New permission",
          inheritFromPermissionIds: [],
        })}
      >
        Create Permission
      </AsyncButton>

      <EnableTeam>
        <PermissionsTable rows={mockPermissions as any} />
      </EnableTeam>
    </>
  );
}
