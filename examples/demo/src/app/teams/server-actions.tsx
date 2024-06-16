'use server';

import { stackServerApp } from "src/stack";

export const createTeam = async (data) => {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  const team = await stackServerApp.createTeam(data);
  await team.addUser(user.id);
  await user.grantPermission(team, 'admin');
};
