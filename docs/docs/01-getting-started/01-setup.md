---
sidebar_position: 1
---

# Installation & Setup

## Installation

To get started with Stack, you need to create a [Next.js](https://nextjs.org/docs) project with the App router. If you are starting from scratch, run the following:
  
```bash
npx create-next-app@latest --app stack-example
```

Once that's done, you can install Stack with npm or yarn:

```bash
npm install @stackframe/stack
```

## Setup

1. If you haven't already, [register a new account on Stack](https://app.stackframe.co). Create a project in the dashboard, create a new API key from the left sidebar, and copy the project ID, publishable client key, and secret server key into a new file called `.env.local` in the root of your Next.js project:

    ```javascript
    NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-client-key>
    STACK_SECRET_SERVER_KEY=<your-secret-server-key>
    ```

2. Create `StackServerApp` in `lib/stack.ts`:
  
    ```tsx
    import "server-only";
    import { StackServerApp } from "@stackframe/stack";

    export const stackApp = new StackServerApp({
      // Automatically reads your API keys from the environment variables you set above.
      //
      // Alternatively, you could set them manually:
      //
      // projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
      // publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
      // secretServerKey: process.env.STACK_SECRET_SERVER_KEY,

      tokenStore: "nextjs-cookie", // storing auth tokens in cookies
    });
    ```
  
    This will create a server app that you can later use to access Stack from your Next.js server.

3. Create a new file in `app/handler/[...stack]/page.tsx` and paste the following code: 

    ```tsx
    import { StackHandler } from "@stackframe/stack";
    import { stackApp } from "@/lib/stack";

    export default function Handler(props: any) {
      return <StackHandler app={stackApp} {...props} />;
    }
    ```

    This will create pages for sign-in, sign-up, password reset, and others. Additionally, it will be used as a callback URL for OAuth. You can [replace them with your own pages](/docs/advanced-guides/customization/overview) later.


4. In your `app/layout.tsx`, wrap your entire layout with a `StackProvider`. Afterwards, it should look like this:

    ```tsx
    import React from "react";
    import { StackProvider } from "@stackframe/stack";
    import { stackApp } from "@/lib/stack";

    export default function Layout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="en">
          <body>
            <StackProvider app={stackApp}>
              {children}
            </StackProvider>
          </body>
        </html>
      );
    }
    ```

    This lets you use the `useStackApp()` and `useUser()` hooks.

5. That's it! Stack is now configured in your Next.js project. If you start your Next.js app with `npm run dev` and navigate to `http://localhost:3000/handler/signup`, you will see the Stack sign-up page!

    ![Stack sign up page](../imgs/signup-page.png)


## Next steps

Next, we will show you how to get user information, protect a page, and modify the user profile.
