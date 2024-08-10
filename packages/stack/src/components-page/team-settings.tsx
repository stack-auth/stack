'use client';

import { ActionCell, ActionDialog, Container, EditableText, Label, SimpleTooltip, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from "@stackframe/stack-ui";
import { Contact, Settings, Users } from "lucide-react";
import { MessageCard, Team, useUser } from "..";
import { SidebarLayout } from "../components/elements/sidebar-layout";
import { UserAvatar } from "../components/elements/user-avatar";
import { useState } from "react";

export function TeamSettings(props: { fullPage?: boolean, teamId: string }) {
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);

  if (!team) {
    return <MessageCard title='Team not found' />;
  }

  const readMemberPermission = user.usePermission(team, '$read_members');

  const inner = <SidebarLayout
    items={[
      { title: 'My Profile', content: <ProfileSettings team={team}/>, icon: Contact, description: `Your profile in the team "${team.displayName}"` },
      ...readMemberPermission ? [{ title: 'Members', content: <MembersSettings team={team}/>, icon: Users }] : [],
      { title: 'Settings', content: <GeneralSettings team={team} />, icon: Settings },
    ]}
    title='Team Settings'
  />;

  if (props.fullPage) {
    return (
      <Container size={800} className='stack-scope'>
        {inner}
      </Container>
    );
  } else {
    return inner;
  }
}

function GeneralSettings(props: { team: Team }) {
  return (
    <>
      <div>
        <Label>Team display name</Label>
        <EditableText value={props.team.displayName} onSave={() => {}}/>
      </div>
    </>
  );
}

function ProfileSettings(props: { team: Team }) {
  return (
    <>
      <div>
        <Label className="flex gap-2">Display name <SimpleTooltip tooltip="This overwrites your user display name in the account setting" type='info'/></Label>
        <EditableText value={props.team.displayName} onSave={() => {}}/>
      </div>
    </>
  );
}

function RemoveMemberDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
}) {
  return (
    <ActionDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Delete domain"
      danger
      okButton={{
        label: "Delete",
        onClick: async () => {
        }
      }}
      cancelButton
    >
      <Typography>
        Do you really want to remove from the team?
      </Typography>
    </ActionDialog>
  );
}

function MembersSettings(props: { team: Team }) {
  const users = props.team.useUsers();
  const user = useUser({ or: 'redirect' });
  const removeMemberPermission = user.usePermission(props.team, '$remove_members');
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  return (
    <>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">User</TableHead>
              <TableHead className="w-[200px]">Name</TableHead>
              {removeMemberPermission && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(({ id, teamProfile }, i) => (
              <TableRow key={id}>
                <TableCell>
                  <UserAvatar user={teamProfile}/>
                </TableCell>
                <TableCell>
                  <Typography>{teamProfile.displayName}</Typography>
                </TableCell>
                {removeMemberPermission && <TableCell>
                  <ActionCell items={[
                    { item: 'Remove', onClick: () => setRemoveModalOpen(true), danger: true },
                  ]}/>
                  <RemoveMemberDialog open={removeModalOpen} onOpenChange={setRemoveModalOpen} />
                </TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}