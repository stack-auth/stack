"use client";

import React from "react";
import { useUser } from "@stackframe/stack";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { CurrentUser, StackAdminApp } from "@stackframe/stack";
import { useRouter } from "@/components/router";

const StackAdminAppContext = React.createContext<StackAdminApp<false> | null>(null);

const usersMap = new Map<string, CurrentUser>();

const createAdminApp = cacheFunction((baseUrl: string, projectId: string, userId: string) => {
  return new StackAdminApp<false, string>({
    baseUrl,
    projectId,
    tokenStore: null,
    projectOwnerSession: usersMap.get(userId)!.session,
  });
});

export function AdminAppProvider(props: { projectId: string, children: React.ReactNode }) {
  const router = useRouter();
  const user = useUser({ or: "redirect", projectIdMustMatch: "internal" });
  const projects = user.useOwnedProjects();

  const project = projects.find(p => p.id === props.projectId);
  if (!project) {
    console.warn(`User ${user.id} does not have access to project ${props.projectId}`);
    setTimeout(() => router.push("/"), 0);
  }

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
    throw new StackAssertionError("useAdminApp must be used within an AdminInterfaceProvider");
  }

  return stackAdminApp;
}
