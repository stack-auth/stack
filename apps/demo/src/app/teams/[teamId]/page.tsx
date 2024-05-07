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
  const canReadContent = await user.hasPermission(team, 'read:content');
  const canReadSecret = await user.hasPermission(team, 'read:secret');
  const permissions = await user.listPermissions(team);

  return <div>
    <Text size='xl'>Team Name: {team.displayName}</Text>
    <Text variant='secondary'>{userTeams.some(t => t.id === team.id) ? '(You are a member)' : '(You are not a member)'}</Text>

    <div className="mb-5"></div>

    <Text>My permissions: {permissions.map(p => p.id).join(', ')}</Text>

    <div className="mb-5"></div>

    <Text>{'You can see this if you are a member (join team): ' + (userTeams.some(t => t.id === team.id) ? '[YOU ARE A MEMBER]' : '🔒')}</Text>
    <Text>{'You can see this if you have the "read:content" permission (get access with the button below): ' + (canReadContent ? '[THIS IS THE CONTENT]' : '🔒')}</Text>
    <Text>{'You can see this if you have the "read:secret" permission (only the creator of the team): ' + (canReadSecret ? '[THIS IS THE SECRET]' : '🔒')}</Text>

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