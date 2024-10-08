import React, { Suspense } from 'react';
import { PublicEnvScript } from '../lib/env';
import { StackAdminApp, StackClientApp, StackServerApp, stackAppInternalsSymbol } from '../lib/stack-app';
import { StackProviderClient, UserSetter } from './stack-provider-client';
import { TranslationProvider } from './translation-provider';


export default function StackProvider({
  children,
  app,
  lang,
}: {
  lang?: React.ComponentProps<typeof TranslationProvider>['lang'],
  children: React.ReactNode,
  // list all three types of apps even though server and admin are subclasses of client so it's clear that you can pass any
  app: StackClientApp<true> | StackServerApp<true> | StackAdminApp<true>,
}) {
  return (
    <>
      <PublicEnvScript />
      <StackProviderClient appJson={app[stackAppInternalsSymbol].toClientJson()}>
        <Suspense fallback={null}>
          <UserFetcher app={app} />
        </Suspense>
        <TranslationProvider lang={lang}>
          {children}
        </TranslationProvider>
      </StackProviderClient>
    </>
  );
}

function UserFetcher(props: { app: StackClientApp<true> }) {
  const userPromise = props.app.getUser().then((user) => user?.toClientJson() ?? null);
  return <UserSetter userJsonPromise={userPromise} />;
}
