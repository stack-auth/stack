"use client";
import { TeamMemberSearchTable } from '@/components/data-table/team-member-search-table';
import { TeamMemberTable } from '@/components/data-table/team-member-table';
import { ServerTeam } from '@stackframe/stack';
import { ActionDialog, Button, useToast } from '@stackframe/stack-ui';
import { notFound } from 'next/navigation';
import { PageLayout } from '../../page-layout';
import { useAdminApp } from '../../use-admin-app';
import { KnownErrors } from '@stackframe/stack-shared';


export function AddUserDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
  team: ServerTeam,
}) {
  const teamUsers = props.team.useUsers();
  const { toast } = useToast();

  return <ActionDialog
    title="Add a user"
    trigger={props.trigger}
  >
    <TeamMemberSearchTable
      action={(user) => <Button
        variant="outline"
        disabled={teamUsers.find(u => u.id === user.id) !== undefined}
        onClick={async () => {
          try {
            await props.team.addUser(user.id);
            toast({ title: 'User added to team', variant: 'success' });
          } catch (error) {
            if (error instanceof KnownErrors.TeamMembershipAlreadyExists) {
              toast({ title: 'User already a member of this team', variant: 'destructive' });
            }
          }
        }}
      >
        {teamUsers.find(u => u.id === user.id) ? 'Added' : 'Add'}
      </Button>}
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
