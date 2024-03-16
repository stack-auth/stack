import React from 'react';
import { StackClientApp, stackAppInternalsSymbol } from '../lib/stack-app';
import { StackProviderClient } from './stack-providerClient';
import { StackUIProvider, ThemeConfig } from '@stackframe/stack-ui';


export default function StackProvider({
  children,
  app,
  theme,
}: {
  children: React.ReactNode,
  app: StackClientApp<true>,
  theme?: ThemeConfig,
}) {
  return (
    <StackProviderClient appJsonPromise={app[stackAppInternalsSymbol].toClientJson()}>
      <StackUIProvider theme={theme}>
        {children}
      </StackUIProvider>
    </StackProviderClient>
  );
}
