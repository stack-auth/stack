
import { stackServerApp } from "src/stack";
import MyTeams from "./my-teams";

export default async function Page() {
  const teams = await stackServerApp.listTeams();
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const userTeams = await user.listTeams();

  return (
    <div>
      <h2>My Teams</h2>

      <MyTeams />

      <h3>All Teams</h3>

      {teams.map((team) => (
        <div key={team.id} className="flex gap-4 items-center">
          <p>{team.displayName}</p>
          <a href={`/teams/${team.id}`}>Open</a>
          <p>{userTeams.some(t => t.id === team.id) ? '(You are a member)' : ''}</p>
        </div>
      ))}
    </div>
  );
}
