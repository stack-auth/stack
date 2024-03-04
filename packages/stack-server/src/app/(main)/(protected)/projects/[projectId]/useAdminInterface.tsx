"use client";

import { StackAdminInterface } from "@stackframe/stack-shared";
import React from "react";
import { useStrictMemo } from "@stackframe/stack-shared/src/hooks/use-strict-memo";
import { useUser } from "@stackframe/stack";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";

const StackAdminInterfaceContext = React.createContext<StackAdminInterface | null>(null);

export function AdminAppProvider(props: { projectId: string, children: React.ReactNode }) {
  const user = useUser({ or: "redirect" });

  const stackAdminApp = useStrictMemo(() => {
    return new StackAdminInterface({
      baseUrl: process.env.NEXT_PUBLIC_STACK_URL || throwErr('missing NEXT_PUBLIC_STACK_URL environment variable'),
      projectId: props.projectId,
      internalAdminAccessToken: user.accessToken ?? throwErr("User must have an access token"),
    });
  }, [props.projectId, user]);

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
