import { StackClientApp } from "@stackframe/js";

// Add type declaration for Vite's import.meta.env
declare global {
  interface ImportMeta {
    env: {
      VITE_STACK_API_URL: string;
      VITE_STACK_PROJECT_ID: string;
      VITE_STACK_PUBLISHABLE_CLIENT_KEY: string;
    };
  }
}

export const stackClientApp = new StackClientApp({
  baseUrl: import.meta.env.VITE_STACK_API_URL,
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: "cookie",
  urls: {
    oauthCallback: window.location.origin + "/oauth",
  },
}); 
