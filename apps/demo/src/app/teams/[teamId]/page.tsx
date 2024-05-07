import { Text } from "@stackframe/stack";
import { stackServerApp } from "src/stack";
import NotFound from "src/app/not-found";
import TeamActions from "./team-actions";

export default async function Page({ params }: { params: { teamId: string } }) {
  const team = await stackServerApp.getTeam(params.teamId);
  if (!team) {
    return NotFound();
  }
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const userTeams = await user.listTeams();
  const members = await team.listMembers();

  return <div>
    <Text size='xl'>{team.displayName}</Text>
    <Text variant='secondary'>{userTeams?.some(t => t.id === team.id) ? '(You are a member)' : '(You are not a member)'}</Text>

    <div className="mb-10"></div>

    <Text size='lg'>Members</Text>

    {members.map((teamUser) => (
      <div key={teamUser.userId}>
        <Text>- {teamUser.displayName}</Text>
      </div>
    ))}

    <div className="mb-10"></div>

    <TeamActions teamId={team.id} />
  </div>;
}