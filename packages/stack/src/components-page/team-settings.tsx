'use client';

import { Container, EditableText, Label, SimpleTooltip } from "@stackframe/stack-ui";
import { Contact, Info, Settings, Users } from "lucide-react";
import { MessageCard, Team, useUser } from "..";
import { SidebarLayout } from "../components/elements/sidebar-layout";

export function TeamSettings(props: { fullPage?: boolean, teamId: string }) {
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);

  if (!team) {
    return <MessageCard title='Team not found' />;
  }

  const inner = <SidebarLayout
    items={[
      { title: 'My Profile', content: <ProfileSettings team={team}/>, icon: Contact, description: `Your profile in the team "${team.displayName}"` },
      { title: 'Members', content: 'Members content', icon: Users },
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
}