/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';
import { useStackApp } from "stack";

export default function CustomOAuthSignIn() {
  const app = useStackApp();

  return <div>
    <h1>My Custom Sign In page</h1>
    <button onClick={async () => await app.signInWithOauth('google')}>Sign In with Google</button>
  </div>;
}