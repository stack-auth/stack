import { StackServerApp } from '@stackframe/stack';
import { getPublicEnvVar } from "@stackframe/stack-shared/dist/utils/env";
import './polyfills';

if (getPublicEnvVar("NEXT_PUBLIC_STACK_PROJECT_ID") !== "internal") {
  throw new Error("This project is not configured correctly. stack-dashboard must always use the internal project.");
}

export const stackServerApp = new StackServerApp<"nextjs-cookie", true, 'internal'>({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/projects",
    afterSignUp: "/new-project",
    afterSignOut: "/",
  }
});
