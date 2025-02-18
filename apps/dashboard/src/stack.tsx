import { StackServerApp } from '@stackframe/stack';
import { getPublicEnvVar } from "@stackframe/stack-shared/dist/utils/env";
import './polyfills';

if (getPublicEnvVar("NEXT_PUBLIC_STACK_PROJECT_ID") !== "internal") {
  throw new Error("This project is not configured correctly. stack-dashboard must always use the internal project.");
}

export const stackServerApp = new StackServerApp<"nextjs-cookie", true, 'internal'>({
  baseUrl: {
    browser: getPublicEnvVar("NEXT_PUBLIC_BROWSER_STACK_DASHBOARD_URL"),
    server: getPublicEnvVar("NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL"),
  },
  projectId: getPublicEnvVar("NEXT_PUBLIC_STACK_PROJECT_ID"),
  publishableClientKey: getPublicEnvVar("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY"),
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/projects",
    afterSignUp: "/new-project",
    afterSignOut: "/",
  }
});
