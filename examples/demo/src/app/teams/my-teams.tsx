import React from 'react';
import { SelectedTeamSwitcher } from "@stackframe/stack";
import { stackServerApp } from 'src/stack';
import { CreateTeam } from './create-team';

export default async function MyTeams() {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const teams = await user.listTeams();


  return (
    <div className='flex-col w-64'>
      <SelectedTeamSwitcher />
      <CreateTeam />

      {teams.length > 0 && teams.map((team) => (
        <div key={team.id}>
          <p>{team.displayName}, <a href={`/teams/${team.id}`}>Open</a></p>
        </div>
      ))}
    </div>
  );
}
