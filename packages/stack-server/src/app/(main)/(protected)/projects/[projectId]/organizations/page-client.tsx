"use client";

import { Paragraph } from "@/components/paragraph";
import { OrganizationTable } from "./organization-table";
import { useMockOrgs } from "./mock-org";


export default function ClientPage() {
  const mockOrgs = useMockOrgs();
  
  return (
    <>
      <Paragraph h1>
        Organizations
      </Paragraph>

      <Paragraph body>
        <OrganizationTable rows={mockOrgs} />
      </Paragraph>
    </>
  );
}
