import "server-only";

import { StackServerApp } from "stack";

export const stackServerApp = new StackServerApp({
  baseUrl: "http://localhost:8101",
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/signin",
  }
});
