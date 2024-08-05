'use client';

import { useStackApp, useUser } from "@stackframe/stack";
import { Button, Input } from "@stackframe/stack-ui";
import React from 'react';

export default function TeamInvitation(props: { teamId: string }) {
  const app = useStackApp();
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);
  const [email, setEmail] = React.useState('');

  if (!team) {
    return null;
  }

  const permission = user.usePermission(team, '$invite_members');

  if (!permission) {
    return "You don't have permission to invite members";
  }

  return (
    <div>
      <Input value={email} onChange={e => setEmail(e.target.value)} />
      <Button
        onClick={async () => {
          await team.inviteUser({ email });
        }}
      >
        {'Invite'}
      </Button>
    </div>
  );
}