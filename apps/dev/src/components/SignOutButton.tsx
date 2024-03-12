'use client';

import { useStackApp, useUser } from "@stackframe/stack";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

export default function SignOutButton() {
  const user = useUser();
  const app = useStackApp();
  return (<button onClick={() => runAsynchronously(async () => {
    await user?.signOut();
    app.redirectToAfterSignOut();
  })}>Sign out</button>);
}
