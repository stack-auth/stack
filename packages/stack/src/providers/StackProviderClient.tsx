"use client";

import { cache, use } from "react";
import { StackClientApp, StackClientAppJson, stackAppInternalsSymbol } from "../lib/stack-app";
import React from "react";
import { useStrictMemo } from "stack-shared/dist/hooks/use-strict-memo";

export const StackContext = React.createContext<null | {
  app: StackClientApp<true>,
}>(null);

const fromClientJsonCached = cache((appJson: StackClientAppJson<true, string>) => StackClientApp[stackAppInternalsSymbol].fromClientJson(appJson));

export function StackProviderClient(props: {
  appJsonPromise: Promise<StackClientAppJson<true, string>>,
  children?: React.ReactNode,
}) {
  const appJson = use(props.appJsonPromise);
  const appPromise = useStrictMemo(() => {
    return fromClientJsonCached(appJson);
  }, [appJson]);
  const app = use(appPromise);

  if (process.env.NODE_ENV === "development") {
    (globalThis as any).stackApp = app;
  }
  
  return (
    <StackContext.Provider value={{ app }}>
      {props.children}
    </StackContext.Provider>
  );
}
