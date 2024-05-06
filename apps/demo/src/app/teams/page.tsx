import { Link, Text } from "@stackframe/stack";
import { stackServerApp } from "src/stack";

export default async function Page() {
  const teams = await stackServerApp.listTeams();
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const userTeams = await user?.listTeams();

  return (
    <div className='flex-col gap-2'>
      <Text size='xl'>All Teams</Text>

      {teams.map((team) => (
        <div key={team.id} className="flex gap-2 items-center">
          <Text>{team.displayName}</Text>
          <Text variant="secondary">{userTeams?.some(t => t.id === team.id) ? '(You are a member)' : ''}</Text>
          <Link href={`/teams/${team.id}`}>Open</Link>
        </div>
      ))}
    </div>
  );
}