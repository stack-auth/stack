"use client";
import { useAdminApp } from '../../use-admin-app';
import { notFound } from 'next/navigation';
import { PageLayout } from '../../page-layout';
import { TeamMemberTable } from '@/components/data-table/team-member-table';
import { ActionDialog, Button, TableBody, TableHead, TableRow, Table, TableHeader, useToast, TableCell } from '@stackframe/stack-ui';
import { TeamMemberSearchTable } from '@/components/data-table/team-member-search-table';
import { ServerTeam } from '@stackframe/stack';


export function AddUserDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
  team: ServerTeam,
}) {
  return <ActionDialog
    title="Add a user"
    trigger={props.trigger}
  >
    <TeamMemberSearchTable team={props.team} />
  </ActionDialog>;
}


export default function PageClient(props: { teamId: string }) {
  const stackAdminApp = useAdminApp();
  const team = stackAdminApp.useTeam(props.teamId);
  const users = team?.useUsers();

  if (!team) {
    return notFound();
  }

  return (
    <PageLayout
      title="Team Members"
      description={`Manage team members of "${team.displayName}"`}
      actions={
        <AddUserDialog trigger={<Button>Add a user</Button>} team={team} />
      }
    >
      <TeamMemberTable users={users || []} team={team} />
    </PageLayout>
  );
}
