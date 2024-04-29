"use client";

import { Paragraph } from "@/components/paragraph";
import { PermissionsTable } from "./permissions-table";
import { mockPermissions } from "./mock-permissions";
import { EnableTeam } from "../enable-team";


export default function ClientPage() {
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
