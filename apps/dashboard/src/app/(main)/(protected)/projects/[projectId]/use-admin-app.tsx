"use client";

import { useRouter } from "@/components/router";
import { StackAdminApp, useUser } from "@stackframe/stack";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import React from "react";

const StackAdminAppContext = React.createContext<StackAdminApp<false> | null>(null);

export function AdminAppProvider(props: { projectId: string, children: React.ReactNode }) {
  const router = useRouter();
  const user = useUser({ or: "redirect", projectIdMustMatch: "internal" });
  const projects = user.useOwnedProjects();

  const project = projects.find(p => p.id === props.projectId);
  if (!project) {
    console.warn(`User ${user.id} does not have access to project ${props.projectId}`);
    setTimeout(() => router.push("/"), 0);
    return null;
  }

  return (
    <StackAdminAppContext.Provider value={project.app}>
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
