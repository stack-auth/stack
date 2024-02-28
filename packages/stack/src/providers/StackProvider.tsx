import { ReactNode } from 'react';
import { StackClientApp, stackAppInternalsSymbol } from '../lib/stack-app';
import { StackProviderClient } from './StackProviderClient';


export default function StackProvider({
  children,
  app,
}: {
  children: ReactNode,
  app: StackClientApp<true>,
}) {
  return (
    <StackProviderClient appOptionsPromise={app[stackAppInternalsSymbol].getSerializableClientOptions()}>
      {children}
    </StackProviderClient>
  );
}
