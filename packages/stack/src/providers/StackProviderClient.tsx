"use client";

import { cache, use } from "react";
import { StackClientApp, StackClientAppJson, stackAppInternalsSymbol } from "../lib/stack-app";
import React from "react";
import { useStrictMemo } from "@stackframe/stack-shared/dist/hooks/use-strict-memo";

export const StackContext = React.createContext<null | {
  app: StackClientApp<true>,
}>(null);

export function StackProviderClient(props: {
  appJsonPromise: Promise<StackClientAppJson<true, string>>,
  children?: React.ReactNode,
}) {
  const appJson = use(props.appJsonPromise);
  const app = StackClientApp[stackAppInternalsSymbol].fromClientJson(appJson);

  if (process.env.NODE_ENV === "development") {
    (globalThis as any).stackApp = app;
  }
  
  return (
    <StackContext.Provider value={{ app }}>
      {props.children}
    </StackContext.Provider>
  );
}
