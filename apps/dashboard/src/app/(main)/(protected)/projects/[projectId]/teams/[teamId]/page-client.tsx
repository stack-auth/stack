"use client";
import { useAdminApp } from '../../use-admin-app';
import { notFound } from 'next/navigation';
import { PageLayout } from '../../page-layout';
import { TeamMemberTable } from '@/components/data-table/team-member-table';


export default function PageClient(props: { teamId: string }) {
  const stackAdminApp = useAdminApp();
  const team = stackAdminApp.useTeam(props.teamId);
  const users = team?.useUsers();

  if (!team) {
    return notFound();
  }

  return (
    <PageLayout title="Team Members" description={`Manage team members of "${team.displayName}"`}>
      <TeamMemberTable users={users || []} team={team} />
    </PageLayout>
  );
}
