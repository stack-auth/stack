import { stackServerApp } from "src/stack";

export default async function UserInfo() {
  const user = await stackServerApp.getUser();
  const serverUser = await stackServerApp.getServerUser();

  return <div>
    {user ? (
      <div>User Status: Logged in as {user.displayName ?? user.primaryEmail}</div>
    ) : (
      <div>User Status: Not signed in</div>
    )}
    {serverUser ? (
      <div>ServerUser Status: Logged in as {serverUser.displayName ?? serverUser.primaryEmail}</div>
    ) : (
      <div>ServerUser Status: Not signed in</div>
    )}
  </div>;
}
