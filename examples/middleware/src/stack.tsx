import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});
(stackServerApp as any).__DEMO_ENABLE_SLIGHT_FETCH_DELAY = true;
