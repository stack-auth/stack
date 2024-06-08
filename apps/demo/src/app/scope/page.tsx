'use client';

import { Button, useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: 'redirect' });

  return (
    <>
      {user.oauthProviders.map((provider) => (
        <div key={provider}>{provider}</div>
      ))}
      <Button onClick={async () => console.log(await (await user.getConnection('google', { or: 'redirect', scopes: ['https://www.googleapis.com/auth/books'] })).getAccessToken())}>
      Get Access Token
      </Button>
    </>
  );
}