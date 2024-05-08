import { Link, Separator, Text } from "@stackframe/stack";
import { stackServerApp } from "src/stack";
import MyTeams from "./my-teams";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const teams = await stackServerApp.listTeams();
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const userTeams = await user.listTeams();

  return (
    <div>
      <Text size='xl'>My Teams</Text>

      <MyTeams />

      <Separator className="my-10" />

      <Text size='xl'>All Teams</Text>

      {teams.map((team) => (
        <div key={team.id} className="flex gap-4 items-center">
          <Text>{team.displayName}</Text>
          <Link href={`/teams/${team.id}`}>Open</Link>
          <Text variant="secondary">{userTeams?.some(t => t.id === team.id) ? '(You are a member)' : ''}</Text>
        </div>
      ))}
    </div>
  );
}