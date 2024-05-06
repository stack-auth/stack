'use client';

import { Button, Text, useUser } from "@stackframe/stack";
import { stackServerApp } from "src/stack";
import { joinTeam, leaveTeam } from "./server-actions";

export default function TeamActions(props: { teamId: string }) {
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);

  return (
    <div>
      {team ? 
        <Button variant="secondary" onClick={async () => {
          await leaveTeam(team.id);
          window.location.reload();
        }}>Leave Team</Button> : 
        <Button onClick={async () => {
          await joinTeam(props.teamId);
          window.location.reload();
        }}>Join Team</Button>
      }
    </div>
  );
}