'use client';

import { useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: 'redirect' });
  const connection = user.useConnectedAccount('facebook', { or: 'redirect' });
  const token = connection.useAccessToken();

  return JSON.stringify(token);
}
