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
 * Use this in a component or a hook to disable SSR. Should be wrapped in a Suspense boundary, or it will throw an error.
 */
export function suspendIfSsr(caller?: string) {
  if (typeof window === "undefined") {
    const error = Object.assign(
      new Error(deindent`
        ${caller ?? "This code path"} attempted to display a loading indicator during SSR by falling back to the nearest Suspense boundary. If you see this error, it means no Suspense boundary was found, and no loading indicator could be displayed. Make sure you are not catching this error with try-catch, and that the component is rendered inside a Suspense boundary, for example by adding a \`loading.tsx\` file in your app directory.

        See: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout

        More information on SSR and Suspense boundaries: https://react.dev/reference/react/Suspense#providing-a-fallback-for-server-errors-and-client-only-content
      `),
      {
        // set the digest so nextjs doesn't log the error
        // https://github.com/vercel/next.js/blob/d01d6d9c35a8c2725b3d74c1402ab76d4779a6cf/packages/next/src/shared/lib/lazy-dynamic/bailout-to-csr.ts#L14
        digest: "BAILOUT_TO_CLIENT_SIDE_RENDERING",
        reason: caller ?? "suspendIfSsr()",
      }
    );

    throw error;
  }
}
