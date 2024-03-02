import { use } from "react";
import { neverResolve } from "./promises";
import { deindent } from "./strings";

export function getNodeText(node: React.ReactNode): string {
  if (["number", "string"].includes(typeof node)) {
    return `${node}`;
  }
  if (!node) {
    return "";
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }
  if (typeof node === "object" && "props" in node) {
    return getNodeText(node.props.children);
  }
  throw new Error(`Unknown node type: ${typeof node}`);
}

/**
 * Suspends the currently rendered component indefinitely. Will not unsuspend unless the component rerenders.
 * 
 * You can use this to translate older query- or AsyncResult-based code to new the Suspense system, for example: `if (query.isLoading) suspend();`
 */
export function suspend(): never {
  use(neverResolve());
  throw new Error("Somehow a Promise that never resolves was resolved?");
}


/**
 * Use this in a component or a hook to disable SSR.
 */
export function suspendIfSsr() {
  if (typeof window === "undefined") {
    throw new Error(deindent`
      This code path is not supported in SSR. This error should be caught by the closest Suspense boundary, and hence never be thrown on the client. If you still see the error, make sure the component is rendered inside a Suspense boundary.

      See: https://react.dev/reference/react/Suspense#providing-a-fallback-for-server-errors-and-client-only-content
    `);
  }
}
