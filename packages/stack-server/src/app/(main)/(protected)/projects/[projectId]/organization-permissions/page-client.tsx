"use client";

import { Paragraph } from "@/components/paragraph";
import { PermissionsTable } from "./permissions-table";
import { mockPermissions } from "./mock-permissions";


export default function ClientPage() {
  return (
    <>
      <Paragraph h1>
        Organization Permissions
      </Paragraph>

      <PermissionsTable rows={mockPermissions as any} />
    </>
  );
}
