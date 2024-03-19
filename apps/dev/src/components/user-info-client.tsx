'use client';

import { useUser } from "@stackframe/stack";

export default function UserInfoClient() {
  const user = useUser();
  
  return (
    <div>
      {user ? (
        <div>User Status: Logged in as {user.displayName ?? user.primaryEmail}</div>
      ) : (
        <div>User Status: Not signed in</div>
      )}
    </div>
  );
}
