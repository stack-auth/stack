---
sidebar_position: 1
---

# Installation & Setup

## Installation

To get started with Stack, you need to create a [Next.js](https://nextjs.org/docs) project with the App router. If you are starting from scratch, run the following:
  
```bash
npx create-next-app@latest --app stack-example
cd stack-example
```

Once that's done, you can install Stack with npm or yarn:

```bash
npm install @stackframe/stack @stackframe/stack-ui
```

## Setup

1. If you haven't already, [register a new account on Stack](https://app.stackframe.co/handler/signup). Create a project in the dashboard, create a new API key from the left sidebar, and copy the project ID, publishable client key, and secret server key into a new file called `.env.local` in the root of your Next.js project:

    ```javascript
    NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-client-key>
    STACK_SECRET_SERVER_KEY=<your-secret-server-key>
    ```

2. Create a new file in `lib/stack.ts` and fill it with the following:
  
    ```tsx
    import "server-only";
    import { StackServerApp } from "@stackframe/stack";

    export const stackApp = new StackServerApp({
      tokenStore: "nextjs-cookie", // storing auth tokens in cookies
    });
    ```
  
    This will read the environment variables automatically and create a server app that you can later use to access Stack from your Next.js server.
    
    Check out the [`StackServerApp` documentation](/docs/api-documentation/app) to learn more about its other options.

3. Create a new file in `app/handler/[...stack]/page.tsx` and paste the following code: 

    ```tsx
    import { StackHandler } from "@stackframe/stack";
    import { stackApp } from "@/lib/stack";

    export default function Handler(props: any) {
      return <StackHandler app={stackApp} {...props} />;
    }
    ```

    This will create pages for sign-in, sign-up, password reset, and others. Additionally, it will be used as a callback URL for OAuth. You can [replace them with your own pages](/docs/customization/overview) later.


4. In your `app/layout.tsx`, wrap the entire body with a `StackProvider` and `StackUIProvider`. Afterwards, it should look like this:

    ```tsx
    import React from "react";
    import { StackProvider } from "@stackframe/stack";
    import { StackUIProvider } from "@stackframe/stack-ui";
    import { stackApp } from "@/lib/stack";

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="en">
          <body>
            <StackProvider app={stackApp}>
              <StackUIProvider>
                {children}
              </StackUIProvider>
            </StackProvider>
          </body>
        </html>
      );
    }
    ```

5. By default, Stack uses [`Suspense`](https://react.dev/reference/react/Suspense) to handle loading states. To show a loading indicator while Stack is fetching user data, make sure there is a `loading.tsx` file in your `app` directory:

    ```tsx
    export default function Loading() {
      // You can use any loading indicator here
      return <>
        Loading...
      </>;
    }
    ```

6. That's it! Stack is now configured in your Next.js project. If you start your Next.js app with `npm run dev` and navigate to `http://localhost:3000/handler/signup`, you will see the Stack sign-up page!

    ![Stack sign up page](../imgs/signup-page.png)


## Next steps

Next, we will show you how to get user information, protect a page, and modify the user profile.
