import React, { Suspense } from 'react';
import { StackAdminApp, StackClientApp, StackServerApp, stackAppInternalsSymbol } from '../lib/stack-app';
import { StackProviderClient, UserSetter } from './stack-provider-client';
import { TranslationProvider } from './translation-provider';


export default function StackProvider({
  children,
  app,
  lang,
  translationOverrides,
}: {
  lang?: React.ComponentProps<typeof TranslationProvider>['lang'],
  /**
   * A mapping of English translations to translated equivalents.
   *
   * These will take priority over the translations from the language specified in the `lang` property. Note that the
   * keys are case-sensitive.
   */
  translationOverrides?: Record<string, string>,
  children: React.ReactNode,
  // list all three types of apps even though server and admin are subclasses of client so it's clear that you can pass any
  app: StackClientApp<true> | StackServerApp<true> | StackAdminApp<true>,
}) {
  return (
    <StackProviderClient appJson={app[stackAppInternalsSymbol].toClientJson()}>
      <Suspense fallback={null}>
        <UserFetcher app={app} />
      </Suspense>
      <TranslationProvider lang={lang} translationOverrides={translationOverrides}>
        {children}
      </TranslationProvider>
    </StackProviderClient>
  );
}

function UserFetcher(props: { app: StackClientApp<true> }) {
  const userPromise = props.app.getUser().then((user) => user?.toClientJson() ?? null);
  return <UserSetter userJsonPromise={userPromise} />;
}
