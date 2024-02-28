"use client";

import { use } from "react";
import { StackClientApp, StackClientAppConstructorOptions } from "../lib/stack-app";
import React from "react";
import { useStrictMemo } from "stack-shared/dist/hooks/use-strict-memo";

export const StackContext = React.createContext<null | {
  app: StackClientApp<true>,
}>(null);

export function StackProviderClient(props: {
  appOptionsPromise: Promise<StackClientAppConstructorOptions<true, string>>,
  children?: React.ReactNode,
}) {
  const appOptions = use(props.appOptionsPromise);
  const app = useStrictMemo(() => {
    return new StackClientApp(appOptions);
  }, [appOptions]);

  if (process.env.NODE_ENV === "development") {
    (globalThis as any).stackApp = app;
  }
  
  return (
    <StackContext.Provider value={{ app }}>
      {props.children}
    </StackContext.Provider>
  );
}
