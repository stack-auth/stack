'use client';

import React from 'react';
import { Button, Input, Link, Text, useUser } from "@stackframe/stack";
import { createTeam } from "./server-actions";

export default function MyTeams() {
  const user = useUser({ or: 'redirect' });
  const teams = user.useTeams();

  const [displayName, setDisplayName] = React.useState('');

  return (
    <div className='flex-col'>
      <div className='flex gap-2 my-6'>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder='Team Name' />
        <Button 
          onClick={async () => {
            await createTeam({ displayName }); 
            window.location.reload();
          }} 
          disabled={!displayName}
        >
          Create Team
        </Button>
      </div>

      {teams && teams.length > 0 && teams.map((team) => (
        <div key={team.id}>
          <Text size='md'>{team.displayName}, <Link href={`/teams/${team.id}`}>open</Link></Text>
        </div>
      ))}
    </div>
  );
}