import React from 'react';
import { SelectedTeamSwitcher } from "@stackframe/stack";
import { StyledLink, Typography } from '@stackframe/stack-ui';
import { stackServerApp } from 'src/stack';
import { CreateTeam } from './create-team';

export default async function MyTeams() {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const teams = await user.listTeams();


  return (
    <div className='flex-col'>
      <SelectedTeamSwitcher />
      <CreateTeam />

      {teams.length > 0 && teams.map((team) => (
        <div key={team.id}>
          <Typography>{team.displayName}, <StyledLink href={`/teams/${team.id}`}>Open</StyledLink></Typography>
        </div>
      ))}
    </div>
  );
}
