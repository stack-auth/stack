'use client';

import { Container, EditableText, Label, SimpleTooltip, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from "@stackframe/stack-ui";
import { Contact, Info, Settings, Users } from "lucide-react";
import { MessageCard, Team, useUser } from "..";
import { SidebarLayout } from "../components/elements/sidebar-layout";
import { UserAvatar } from "../components/elements/user-avatar";

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

function MembersSettings(props: { team: Team }) {
  const users = props.team.useUsers();

  return (
    <>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">User</TableHead>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
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
                <TableCell>
                  <button className='btn btn-danger btn-sm'>Remove</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}