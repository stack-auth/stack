"use client";

import React from "react";
import { useStackApp, useUser } from "@stackframe/stack";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { CurrentUser, StackAdminApp } from "@stackframe/stack";

const StackAdminAppContext = React.createContext<StackAdminApp<false> | null>(null);

const usersMap = new Map<string, CurrentUser>();

const createAdminApp = cacheFunction((baseUrl: string, projectId: string, userId: string) => {
  return new StackAdminApp<false, string>({
    baseUrl,
    projectId,
    tokenStore: null,
    projectOwnerTokens: usersMap.get(userId)!.tokenStore,
  });
});

export function AdminAppProvider(props: { projectId: string, children: React.ReactNode }) {
  const user = useUser({ or: "redirect" });

  usersMap.set(user.id, user);
  const stackAdminApp = createAdminApp(
    process.env.NEXT_PUBLIC_STACK_URL || throwErr('missing NEXT_PUBLIC_STACK_URL environment variable'),
    props.projectId,
    user.id,
  );

  return (
    <StackAdminAppContext.Provider value={stackAdminApp}>
      {props.children}
    </StackAdminAppContext.Provider>
  );
}

export function useAdminApp() {
  const stackAdminApp = React.useContext(StackAdminAppContext);
  if (!stackAdminApp) {
    throw new Error("useAdminApp must be used within a AdminInterfaceProvider");
  }

  return stackAdminApp;
}
