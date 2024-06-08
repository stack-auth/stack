'use client';

import { useRef, useEffect, useState } from "react";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import MessageCard from "../components/message-cards/message-card";

export default function OAuthCallback(props: { fullPage?: boolean }) {
  const app = useStackApp();
  const called = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const [showRedirectLink, setShowRedirectLink] = useState(false);

  useEffect(() => runAsynchronously(async () => {
    if (called.current) return;
    called.current = true;
    let hasRedirected = false;
    try {
      hasRedirected = await app.callOAuthCallback();
    } catch (e: any) {
      setError(e);
    }
    if (!hasRedirected && process.env.NODE_ENV === 'production') {
      await app.redirectToSignIn();
    }
  }), []);

  useEffect(() => {
    setTimeout(() => setShowRedirectLink(true), 3000);
  }, []);

  return <MessageCard title='Redirecting...' fullPage={props.fullPage}>
    {showRedirectLink ? <p>If you are not redirected automatically, <a href={app.urls.home}>click here</a>.</p> : null}
    {error ? <div>
      <p>Something went wrong while processing the OAuth callback:</p>
      <pre>{JSON.stringify(error, null, 2)}</pre>
      <p>This is most likely an error in Stack. Please report it.</p>
    </div> : null}
  </MessageCard>;
}
