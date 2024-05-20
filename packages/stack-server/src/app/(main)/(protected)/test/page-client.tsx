'use client';

import { Button } from "@/components/ui/button";
import { useUser } from "@stackframe/stack";

export default function PageClient() {
  const user = useUser({ or: 'redirect' });
  const teams = user.useTeams();
  const team = user.useSelectedTeam();
  return <div>
    <p>Selected Team: {team ? team.displayName : 'None'}</p>
    {teams.map((t) => <Button key={t.id} onClick={async () => user.updateSelectedTeam(t)}>{t.displayName}</Button>)}
    <Button onClick={async () => user.updateSelectedTeam(null)}>Clear</Button>
  </div>;
}