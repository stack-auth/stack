
import { Link, Separator, Typography } from "@stackframe/stack-ui";
import { stackServerApp } from "src/stack";
import MyTeams from "./my-teams";

export default async function Page() {
  const teams = await stackServerApp.listTeams();
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const userTeams = await user.listTeams();

  return (
    <div>
      <Typography type='h2'>My Teams</Typography>

      <MyTeams />

      <Separator className="my-10" />

      <Typography type='h3'>All Teams</Typography>

      {teams.map((team) => (
        <div key={team.id} className="flex gap-4 items-center">
          <Typography>{team.displayName}</Typography>
          <Link href={`/teams/${team.id}`}>Open</Link>
          <Typography variant="secondary">{userTeams.some(t => t.id === team.id) ? '(You are a member)' : ''}</Typography>
        </div>
      ))}
    </div>
  );
}
