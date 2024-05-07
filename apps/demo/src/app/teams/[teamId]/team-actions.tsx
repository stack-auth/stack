'use client';

import { Button, useUser } from "@stackframe/stack";
import { grantReadContentPermission, joinTeam, leaveTeam } from "./server-actions";

export default function TeamActions(props: { teamId: string }) {
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);

  return (
    <div>
      {team ? 
        <div className="flex gap-5">
          <Button 
            onClick={async () => {
              await grantReadContentPermission(team.id);
              window.location.reload();
            }}
          >
            {'Get the "read:content" permission'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={async () => {
              await leaveTeam(team.id);
              window.location.reload();
            }}
          >
            Leave Team
          </Button>
        </div> : 
        <Button 
          onClick={async () => {
            await joinTeam(props.teamId);
            window.location.reload();
          }}
        >
          Join Team
        </Button>
      }
    </div>
  );
}