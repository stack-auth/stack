"use client";

import React, { use } from 'react';
import { Paragraph } from "@/components/paragraph";
import { useMockTeams } from '../mock-team';
import { MemberTable } from './member-table';


export default function ClientPage() {
  const mockTeams = useMockTeams();
  const team = mockTeams[0];
  const users = use(mockTeams[0].listUsers());
  
  return (
    <>
      <Paragraph h1>
        {team.displayName}
      </Paragraph>

      <Paragraph body>
        <MemberTable rows={users} />
      </Paragraph>
    </>
  );
}
