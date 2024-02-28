import "server-only";

import { StackServerApp } from "stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/signin",
  }
});
