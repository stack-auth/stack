'use server';

import { stackServerApp } from "src/stack";

export const createTeam = async (data) => {
  const user = await stackServerApp.getUser({ or: 'throw' });
  const team = await stackServerApp.createTeam(data);
  await team.addUser(user.id);
};