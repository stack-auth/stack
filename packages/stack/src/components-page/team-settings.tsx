'use client';

import { Container } from "@stackframe/stack-ui";
import { Contact, Info, Users } from "lucide-react";
import { SidebarLayout } from "../components/elements/sidebar-layout";
import { MessageCard, useUser } from "..";

export function TeamSettings(props: { fullPage?: boolean, teamId: string }) {
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);

  if (!team) {
    return <MessageCard title='Team not found' />;
  }

  const inner = <SidebarLayout
    items={[
      { title: 'General', content: <GeneralSettings/>, icon: Info },
      { title: 'My Profile', content: 'Profile content', icon: Contact },
      { title: 'Members', content: 'Members content', icon: Users },
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

function GeneralSettings() {
  return (
    <div className="border rounded-md p-2">
      asdf
    </div>
  );
}