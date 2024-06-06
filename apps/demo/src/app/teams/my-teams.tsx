import React from 'react';
import { Link, Text } from "@stackframe/stack";
import { stackServerApp } from 'src/stack';
import { CreateTeam } from './create-team';

export default async function MyTeams() {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const teams = await user.listTeams();


  return (
    <div className='flex-col'>
      <CreateTeam />

      {teams.length > 0 && teams.map((team) => (
        <div key={team.id}>
          <Text size='md'>{team.displayName}, <Link href={`/teams/${team.id}`}>Open</Link></Text>
        </div>
      ))}
    </div>
  );
}
