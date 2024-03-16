import { ReactNode } from 'react';
import { StackClientApp, stackAppInternalsSymbol } from '../lib/stack-app';
import { StackProviderClient } from './stack-providerClient';


export default function StackProvider({
  children,
  app,
}: {
  children: ReactNode,
  app: StackClientApp<true>,
}) {
  return (
    <StackProviderClient appJsonPromise={app[stackAppInternalsSymbol].toClientJson()}>
      {children}
    </StackProviderClient>
  );
}
