import './polyfills';

import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/projects",
    afterSignUp: "/projects",
    afterSignOut: "/",
  }
});
