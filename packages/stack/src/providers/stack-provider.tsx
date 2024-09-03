import React, { Suspense } from "react";
import { StackAdminApp, StackClientApp, StackServerApp, stackAppInternalsSymbol } from "../lib/stack-app";
import { StackProviderClient, UserSetter } from "./stack-provider-client";

export default function StackProvider({
  children,
  app,
}: {
  children: React.ReactNode;
  // list all three types of apps even though server and admin are subclasses of client so it's clear that you can pass any
  app: StackClientApp<true> | StackServerApp<true> | StackAdminApp<true>;
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
