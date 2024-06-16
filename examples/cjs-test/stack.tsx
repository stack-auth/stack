require("server-only");

const { StackServerApp } = require("@stackframe/stack");

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});
