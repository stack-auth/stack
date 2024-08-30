'use client';

import { useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: 'redirect'});
  const { token } = user.useJwt('test');

  return <div>{token}</div>;
}
