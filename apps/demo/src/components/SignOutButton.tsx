'use client';

import { useUser } from "stack";
import { runAsynchronously } from "stack-shared/dist/utils/promises";

export default function SignOutButton() {
  const user = useUser();
  return (<button onClick={() => runAsynchronously(user?.signOut())}>Sign out</button>);
}
