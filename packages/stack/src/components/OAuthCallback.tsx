'use client';
import { useRef, useEffect } from "react";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import MessageCard from "../elements/MessageCard";
import { useRouter } from "next/navigation";

export default function OAuthCallback () {
  const app = useStackApp();
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => runAsynchronously(async () => {
    if (called.current) return;
    called.current = true;
    await app.callOAuthCallback();
    router.push(app.urls.userHome);
  }), []);

  return <MessageCard title='Redirecting...' fullPage />;
}
