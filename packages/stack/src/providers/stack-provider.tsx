import React from 'react';
import { StackClientApp, stackAppInternalsSymbol } from '../lib/stack-app';
import { StackProviderClient } from './stack-provider-client';


export default function StackProvider({
  children,
  app,
}: {
  children: React.ReactNode,
  app: StackClientApp<true>,
}) {
  return (
    <StackProviderClient appJsonPromise={app[stackAppInternalsSymbol].toClientJson()}>
      {children}
    </StackProviderClient>
  );
}
