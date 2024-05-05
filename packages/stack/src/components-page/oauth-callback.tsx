'use client';

import { useRef, useEffect, useState } from "react";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import MessageCard from "../components/message-card";

export default function OAuthCallback () {
  const app = useStackApp();
  const called = useRef(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => runAsynchronously(async () => {
    if (called.current) return;
    called.current = true;
    try {
      await app.callOAuthCallback();
    } catch (e: any) {
      setError(e);
    }
  }), []);

  return <MessageCard title='Redirecting...' fullPage>
    {error ? <div>
      <p>Something went wrong while processing the OAuth callback:</p>
      <pre>{JSON.stringify(error, null, 2)}</pre>
      <p>This is most likely an error in Stack. Please report it.</p>
    </div> : null}
  </MessageCard>;
}
