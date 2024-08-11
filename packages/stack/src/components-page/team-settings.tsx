'use client';

import { ActionCell, ActionDialog, Button, Container, EditableText, Input, Label, SimpleTooltip, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from "@stackframe/stack-ui";
import { Contact, Info, Settings, Users } from "lucide-react";
import { useState } from "react";
import { MessageCard, Team, useUser } from "..";
import { SidebarLayout } from "../components/elements/sidebar-layout";
import { UserAvatar } from "../components/elements/user-avatar";

export function TeamSettings(props: { fullPage?: boolean, teamId: string }) {
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);

  if (!team) {
    return <MessageCard title='Team not found' />;
  }


  const inner = <SidebarLayout
    items={[
      { title: 'My Profile', content: profileSettings({ team }), icon: Contact, description: `Your profile in the team "${team.displayName}"` },
      { title: 'Members', content: membersSettings({ team }), icon: Users },
      { title: 'Team Info', content: managementSettings({ team }), icon: Info },
      { title: 'Settings', content: userSettings({ team }), icon: Settings },
    ].filter(({ content }) => content as any)}
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

function managementSettings(props: { team: Team }) {
  const user = useUser({ or: 'redirect' });
  const updateTeamPermission = user.usePermission(props.team, '$update_team');

  if (!updateTeamPermission) {
    return null;
  }

  return (
    <>
      <div>
        <Label>Team display name</Label>
        <EditableText value={props.team.displayName} onSave={() => {}}/>
      </div>
    </>
  );
}

function profileSettings(props: { team: Team }) {
  const user = useUser({ or: 'redirect' });
  const profile = user.useTeamProfile(props.team);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <Label className="flex gap-2">Display name <SimpleTooltip tooltip="This overwrites your user display name in the account setting" type='info'/></Label>
        <EditableText
          value={profile.displayName || ''}
          onSave={async (newDisplayName) => {
            await profile.update({ displayName: newDisplayName });
          }}/>
      </div>
    </div>
  );
}

function userSettings(props: { team: Team }) {
  return (
    <div>
      <div>
        <Button variant='secondary' onClick={() => {}}>Leave team</Button>
      </div>
    </div>
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

function membersSettings(props: { team: Team }) {
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const user = useUser({ or: 'redirect' });
  const removeMemberPermission = user.usePermission(props.team, '$remove_members');
  const readMemberPermission = user.usePermission(props.team, '$read_members');
  const inviteMemberPermission = user.usePermission(props.team, '$invite_members');
  const [email, setEmail] = useState('');

  if (!readMemberPermission && !inviteMemberPermission) {
    return null;
  }

  const users = props.team.useUsers();

  return (
    <>
      <div className="flex flex-col gap-8">
        {inviteMemberPermission &&
          <div>
            <Label>Invite a user to team</Label>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
              <Button onClick={async () => {
                await props.team.inviteUser({ email });
              }}>Invite</Button>
            </div>
          </div>}
        {readMemberPermission &&
        <div>
          <Label>Members</Label>
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
        </div>}
      </div>
    </>
  );
}