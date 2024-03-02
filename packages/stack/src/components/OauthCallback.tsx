'use client';
import { useRef, useEffect } from "react";
import { useStackApp } from "..";
import { runAsynchronously } from "stack-shared/dist/utils/promises";
import MessageCard from "../elements/MessageCard";
import { useRouter } from "next/navigation";

export default function OauthCallback () {
  const app = useStackApp();
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => runAsynchronously(async () => {
    if (called.current) return;
    called.current = true;
    await app.callOauthCallback();
    router.push(app.urls.userHome);
  }), []);

  return <MessageCard title='Redirecting...' fullPage />;
}
