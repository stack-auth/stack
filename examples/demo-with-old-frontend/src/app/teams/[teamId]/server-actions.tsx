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

export const grantReadContentPermission = async (teamId: string) => {
  const user = await stackServerApp.getServerUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  const team = await stackServerApp.getTeam(teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  await user.grantPermission(team, 'read:content');
};

export const uploadProfileImage = async (teamId: string, file: string) => {
  const user = await stackServerApp.getServerUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  const team = await stackServerApp.getTeam(teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  await team.update({
    profileImageUrl: file,
  });
};