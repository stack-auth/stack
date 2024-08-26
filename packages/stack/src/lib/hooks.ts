import { CurrentUser, GetUserOptions as AppGetUserOptions, StackClientApp, CurrentInternalUser } from "./stack-app";
import { StackContext } from "../providers/stack-provider-client";
import { useContext } from "react";

type GetUserOptions = AppGetUserOptions<true> & {
  projectIdMustMatch?: string,
};

/**
 * Returns the current user object. Equivalent to `useStackApp().useUser()`.
 *
 * @returns the current user
 */
export function useUser(options: GetUserOptions & { or: 'redirect' | 'throw', projectIdMustMatch: "internal" }): CurrentInternalUser;
export function useUser(options: GetUserOptions & { or: 'redirect' | 'throw' }): CurrentUser;
export function useUser(options: GetUserOptions & { projectIdMustMatch: "internal" }): CurrentInternalUser | null;
export function useUser(options?: GetUserOptions): CurrentUser | CurrentInternalUser | null;
export function useUser(options: GetUserOptions = {}): CurrentUser | CurrentInternalUser | null {
  const stackApp = useStackApp(options);
  if (options.projectIdMustMatch && stackApp.projectId !== options.projectIdMustMatch) {
    throw new Error("Unexpected project ID in useStackApp: " + stackApp.projectId);
  }
  if (options.projectIdMustMatch === "internal") {
    return stackApp.useUser(options) as CurrentInternalUser;
  } else {
    return stackApp.useUser(options) as CurrentUser;
  }
}

/**
 * Returns the current Stack app associated with the StackProvider.
 *
 * @returns the current Stack app
 */
export function useStackApp<ProjectId extends string>(options: { projectIdMustMatch?: ProjectId } = {}): StackClientApp<true, ProjectId> {
  const context = useContext(StackContext);
  if (context === null) {
    throw new Error("useStackApp must be used within a StackProvider");
  }
  const stackApp = context.app;
  if (options.projectIdMustMatch && stackApp.projectId !== options.projectIdMustMatch) {
    throw new Error("Unexpected project ID in useStackApp: " + stackApp.projectId);
  }
  return stackApp as StackClientApp<true, ProjectId>;
}
