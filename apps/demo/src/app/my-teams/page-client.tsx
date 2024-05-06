'use client';
import { Link, Text, useUser } from "@stackframe/stack";

export default function PageClient() {
  const user = useUser({ or: 'redirect' });
  const teams = user.useTeams();
  return (
    <div>
      <Text size='lg'>Teams</Text>
      {teams && teams.length > 0 && teams.map((team) => (
        <div key={team.id}>
          <Text size='md'>{team.displayName}, <Link href={`/teams/${team.id}`}>open</Link></Text>
        </div>
      ))}
    </div>
  );
}