"use client";

import React from "react";
import { useUser } from "@stackframe/stack";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { CurrentUser, StackAdminApp } from "@stackframe/stack/dist/lib/stack-app";

const StackAdminInterfaceContext = React.createContext<StackAdminApp<true> | null>(null);

const createAdminInterface = cacheFunction((baseUrl: string, projectId: string, user: CurrentUser) => {
  return new StackAdminApp({
    baseUrl,
    projectId,
    tokenStore: "nextjs-cookie",
    projectOwnerTokens: user.tokenStore,
  });
});

export function AdminAppProvider(props: { projectId: string, children: React.ReactNode }) {
  const user = useUser({ or: "redirect" });

  const stackAdminApp = createAdminInterface(
    process.env.NEXT_PUBLIC_STACK_URL || throwErr('missing NEXT_PUBLIC_STACK_URL environment variable'),
    props.projectId,
    user,
  );

  return (
    <StackAdminInterfaceContext.Provider value={stackAdminApp}>
      {props.children}
    </StackAdminInterfaceContext.Provider>
  );
}

export function useAdminApp() {
  const stackAdminInterface = React.useContext(StackAdminInterfaceContext);
  if (!stackAdminInterface) {
    throw new Error("useAdminApp must be used within a AdminInterfaceProvider");
  }

  return stackAdminInterface;
}
