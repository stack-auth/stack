"use client";

import React from 'react';
import { Paragraph } from "@/components/paragraph";
import { MemberTable } from './member-table';
import { useAdminApp } from '../../use-admin-app';
import { notFound } from 'next/navigation';
import { SmartSwitch } from '@/components/smart-switch';
import { PageLayout } from '../../page-layout';


export default function ClientPage(props: { teamId: string }) {
  const stackAdminApp = useAdminApp();
  const team = stackAdminApp.useTeam(props.teamId);
  const users = team?.useMembers();

  if (!team) {
    return notFound();
  }
  
  return (
    <PageLayout title="Team Members" description={`Manage team members of "${team.displayName}"`}>

      <Paragraph body>
        <MemberTable rows={users || []} team={team} />
      </Paragraph>
    </PageLayout>
  );
}
