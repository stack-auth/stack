'use client';

import { useUser, useStackApp } from "@stackframe/stack";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

export default function SignOutButton() {
  const user = useUser();
  return (<button onClick={() => runAsynchronously(user?.signOut())}>Sign out</button>);
}
