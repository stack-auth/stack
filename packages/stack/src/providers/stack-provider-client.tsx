"use client";

import { useEffect } from "react";
import { StackClientApp, StackClientAppJson, stackAppInternalsSymbol } from "../lib/stack-app";
import React from "react";
import { UserJson } from "@stackframe/stack-shared";
import { useStackApp } from "..";

export const StackContext = React.createContext<null | {
  app: StackClientApp<true>,
}>(null);

export function StackProviderClient(props: {
  appJson: StackClientAppJson<true, string>,
  children?: React.ReactNode,
}) {
  const appJson = props.appJson;
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

export function UserSetter(props: { userJsonPromise: Promise<UserJson | null> }) {
  const app = useStackApp();
  useEffect(() => {
    const promise = (async () => await props.userJsonPromise)();  // there is a Next.js bug where Promises passed by server components return `undefined` as their `then` value, so wrap it in a normal promise
    app[stackAppInternalsSymbol].setCurrentUser(promise);
  }, []);
  return null;
}
