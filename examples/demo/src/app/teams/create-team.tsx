"use client";

import { useUser } from "@stackframe/stack";
import { Button, Input } from "@stackframe/stack-ui";
import React from "react";

export function CreateTeam() {
  const [displayName, setDisplayName] = React.useState('');
  const user = useUser({ or: 'redirect' });

  return (
    <div className='flex gap-2 my-6'>
      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder='Team Name' />
      <Button
        onClick={async () => {
          await user.createTeam({ displayName });
          window.location.reload();
        }}
        disabled={!displayName}
      >
      Create Team
      </Button>
    </div>
  );
}
