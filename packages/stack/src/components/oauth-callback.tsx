'use client';
import { useRef, useEffect } from "react";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import MessageCard from "../elements/message-card";

export default function OAuthCallback () {
  const app = useStackApp();
  const called = useRef(false);

  useEffect(() => runAsynchronously(async () => {
    if (called.current) return;
    called.current = true;
    await app.callOAuthCallback();
  }), []);

  return <MessageCard title='Redirecting...' fullPage />;
}
