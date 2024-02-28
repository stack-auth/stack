"use client";

import { StackAdminInterface } from "stack-shared";
import React from "react";
import { useStrictMemo } from "stack-shared/src/hooks/use-strict-memo";
import { useUser } from "stack";
import { throwErr } from "stack-shared/dist/utils/errors";

const StackAdminInterfaceContext = React.createContext<StackAdminInterface | null>(null);

export function AdminAppProvider(props: { projectId: string, children: React.ReactNode }) {
  const user = useUser({ or: "redirect" });

  const stackAdminApp = useStrictMemo(() => {
    return new StackAdminInterface({
      baseUrl: process.env.NEXT_PUBLIC_STACK_URL!,
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
