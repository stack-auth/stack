'use client';
import { useStackApp } from "@stackframe/stack";
import { Button, Typography } from "@stackframe/stack-ui";

export default function CustomOAuthSignIn() {
  const app = useStackApp();
  return (
    <div>
      <Typography type='h1'>My Custom Sign In page</Typography>
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <Button onClick={async () => {
        // this will redirect to the OAuth provider's login page
        await app.signInWithOAuth('google');
      }}>
        Sign In with Google
      </Button>
    </div>
  );
}
