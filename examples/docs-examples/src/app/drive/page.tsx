'use client';

import { useEffect, useState } from 'react';
import { useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: 'redirect' });
  const account = user.useConnectedAccount('google', { or: 'redirect', scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
  const tokens = account.useAccessToken();
  const [response, setResponse] = useState<any>();

  useEffect(() => {
    fetch('https://www.googleapis.com/drive/v3/files', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    })
      .then((res) => res.json())
      .then((data) => setResponse(data))
      .catch((err) => console.error(err));
  }, [tokens]);

  return <div>{response ? JSON.stringify(response) : 'Loading...'}</div>;
}
