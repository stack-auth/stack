"use client";

import React, { use } from 'react';
import { Paragraph } from "@/components/paragraph";
import { useMockOrgs } from '../mock-org';
import { MemberTable } from './member-table';


export default function ClientPage() {
  const mockOrgs = useMockOrgs();
  const org = mockOrgs[0];
  const users = use(mockOrgs[0].listUsers());
  
  return (
    <>
      <Paragraph h1>
        {org.displayName}
      </Paragraph>

      <Paragraph body>
        <MemberTable rows={users} />
      </Paragraph>
    </>
  );
}
