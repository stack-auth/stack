import { notFound } from "next/navigation";
import { Typography } from "@stackframe/stack-ui";
import { stackServerApp } from "src/stack";
import TeamActions from "./team-actions";

export default async function Page({ params }: { params: { teamId: string } }) {
  const team = await stackServerApp.getTeam(params.teamId);
  if (!team) {
    return notFound();
  }
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const userTeams = await user.listTeams();
  const members = await team.listMembers();
  const canReadContent = await user.hasPermission(team, 'read:content');
  const canReadSecret = await user.hasPermission(team, 'read:secret');
  const permissions = await user.listPermissions(team);

  return <div>
    <Typography type='h2'>Team Name: {team.displayName}</Typography>
    <Typography variant='secondary'>{userTeams.some(t => t.id === team.id) ? '(You are a member)' : '(You are not a member)'}</Typography>

    <div className="mb-5"></div>

    <Typography>My permissions: {permissions.map(p => p.id).join(', ')}</Typography>

    <div className="mb-5"></div>

    <Typography>{'You can see this if you are a member (get access by joining the team): ' + (userTeams.some(t => t.id === team.id) ? '[YOU ARE A MEMBER]' : '🔒')}</Typography>
    <Typography>{'You can see this if you have the "read:content" permission (get access by pressing the button below): ' + (canReadContent ? '[THIS IS THE CONTENT]' : '🔒')}</Typography>
    <Typography>{'You can see this if you have the "read:secret" permission (only the creator of the team has access): ' + (canReadSecret ? '[THIS IS THE SECRET]' : '🔒')}</Typography>

    <div className="mb-10"></div>

    <Typography type='h3'>Members</Typography>

    {members.map((teamUser) => (
      <div key={teamUser.userId}>
        <Typography>- {teamUser.displayName || '[no name]'}</Typography>
      </div>
    ))}

    <div className="mb-10"></div>

    <TeamActions teamId={team.id} />
  </div>;
}
