/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';
import { useStackApp } from "@stackframe/stack";

export default function CustomOAuthSignIn() {
  const app = useStackApp();

  return <div>
    <h1>My Custom Sign In page</h1>
    <button onClick={async () => {
      // this will redirect to the OAuth provider's login page
      await app.signInWithOAuth('google');
    }}>
      Sign In with Google
    </button>
  </div>;
}