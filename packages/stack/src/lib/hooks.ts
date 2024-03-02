import { CurrentUser, GetUserOptions, StackClientApp } from "./stack-app";
import { StackContext } from "../providers/StackProviderClient";
import { useContext } from "react";

/**
 * Returns the current user object. Equivalent to `useStackApp().useUser()`.
 * 
 * @returns the current user
 */

export function useUser(options: GetUserOptions & { or: 'redirect' }): CurrentUser;
export function useUser(options: GetUserOptions & { or: 'throw' }): CurrentUser;
export function useUser(options?: GetUserOptions): CurrentUser | null;
export function useUser(options?: GetUserOptions): CurrentUser | null {
  return useStackApp().useUser(options);
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
