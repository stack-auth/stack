import React, { Suspense } from 'react';
import { StackClientApp, stackAppInternalsSymbol } from '../lib/stack-app';
import { StackProviderClient, UserSetter } from './stack-provider-client';


export default function StackProvider({
  children,
  app,
}: {
  children: React.ReactNode,
  app: StackClientApp<true>,
}) {
  return (
    <StackProviderClient appJson={app[stackAppInternalsSymbol].toClientJson()}>
      <Suspense fallback={null}>
        <UserFetcher app={app} />
      </Suspense>
      {children}
    </StackProviderClient>
  );
}

function UserFetcher(props: { app: StackClientApp<true> }) {
  const userPromise = props.app.getUser().then((user) => user?.toClientJson() ?? null);
  return <UserSetter userJsonPromise={userPromise} />;
}
