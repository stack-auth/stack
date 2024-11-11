"use client";
import { TeamMemberSearchTable } from '@/components/data-table/team-member-search-table';
import { TeamMemberTable } from '@/components/data-table/team-member-table';
import { ServerTeam } from '@stackframe/stack';
import { ActionDialog, Button } from '@stackframe/stack-ui';
import { notFound } from 'next/navigation';
import { PageLayout } from '../../page-layout';
import { useAdminApp } from '../../use-admin-app';


export function AddUserDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
  team: ServerTeam,
}) {
  const teamUsers = props.team.useUsers();

  return <ActionDialog
    title="Add a user"
    trigger={props.trigger}
  >
    <TeamMemberSearchTable
      action={(user) =>
        <div className="w-[100px] flex justify-center">
          <Button
            variant="outline"
            disabled={teamUsers.find(u => u.id === user.id) !== undefined}
            onClick={async () => {
              await props.team.addUser(user.id);
            }}
          >
            {teamUsers.find(u => u.id === user.id) ? 'Added' : 'Add'}
          </Button>
        </div>}
    />
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
