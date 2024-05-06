'use client';

import { useUser } from "@stackframe/stack";
import NotFound from "src/app/not-found";

export default function PageClient(props: { teamId: string }) {
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(props.teamId);

  if (!team) {
    return NotFound();
  }

  return <div>{team.displayName}</div>;
}