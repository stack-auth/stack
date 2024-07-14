import { notFound } from "next/navigation";
import { stackServerApp } from "src/stack";
import TeamActions from "./team-actions";
import { ProfileImageUpload } from "./profile-image-upload";

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
    <h2>Team Name: {team.displayName}</h2>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={team.profileImageUrl} alt={'team profile image'} style={{ width: '100px', height: '100px' }} />
    <p>
      {userTeams.some(t => t.id === team.id) ?
        <>
          (You are a member)
          <ProfileImageUpload teamId={team.id} />
        </> :
        '(You are not a member)'}
    </p>

    <div className="mb-5"></div>

    <p>My permissions: {permissions.map(p => p.id).join(', ')}</p>

    <div className="mb-5"></div>

    <p>{'You can see this if you are a member (get access by joining the team): ' + (userTeams.some(t => t.id === team.id) ? '[YOU ARE A MEMBER]' : '🔒')}</p>
    <p>{'You can see this if you have the "read:content" permission (get access by pressing the button below): ' + (canReadContent ? '[THIS IS THE CONTENT]' : '🔒')}</p>
    <p>{'You can see this if you have the "read:secret" permission (only the creator of the team has access): ' + (canReadSecret ? '[THIS IS THE SECRET]' : '🔒')}</p>

    <div className="mb-10"></div>

    <h3>Members</h3>

    {members.map((teamUser) => (
      <div key={teamUser.userId}>
        <p>- {teamUser.displayName || '[no name]'}</p>
      </div>
    ))}

    <div className="mb-10"></div>

    <TeamActions teamId={team.id} />
  </div>;
}
