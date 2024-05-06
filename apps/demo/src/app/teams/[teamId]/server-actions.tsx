'use server';

import { stackServerApp } from "src/stack";

export const leaveTeam = async (teamId: string) => {
  const user = await stackServerApp.getUser({ or: 'throw' });
  const team = await stackServerApp.getTeam(teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  await team.removeUser(user.id);
};

export const joinTeam = async (teamId: string) => {
  const user = await stackServerApp.getUser({ or: 'throw' });
  const team = await stackServerApp.getTeam(teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  await team.addUser(user.id);
};