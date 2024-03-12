'use client';
import { useRef, useEffect } from "react";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import MessageCard from "../elements/MessageCard";

export default function OAuthCallback () {
  const app = useStackApp();
  const called = useRef(false);

  useEffect(() => runAsynchronously(async () => {
    if (called.current) return;
    called.current = true;
    const { newUser } = await app.callOAuthCallback();
    if (newUser) {
      await app.redirectToAfterSignUp();
    } else {
      await app.redirectToAfterSignIn();
    }
  }), []);

  return <MessageCard title='Redirecting...' fullPage />;
}
