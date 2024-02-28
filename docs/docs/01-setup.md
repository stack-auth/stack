---
sidebar_position: 1
---

# Install & Setup

## Installation

To get started with the Stack, you need to have [Next.js](https://nextjs.org/docs) setup for you project. If you are starting from scratch, run the following command to create a new Next.js project:
  
```bash
npx create-next-app@latest stack-example
```

Once you have your Next.js project setup, you can install Stack by running the following command:

```bash
npm install @stack/next
```

## Setup

1. Register an account on Stack [here](https://stack.app) if you don't already have and account. Create an project in the dashboard, and put the Project ID, publishable client key, and secret server key in the `.env.local` file in the root of your Next.js project like this:

    ```javascript
    NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-client-key>
    STACK_SECRET_SERVER_KEY=<your-secret-server-key>
    ```

2. Create `StackServerApp` in `lib/stack.ts`:
  
    ```tsx
    import { StackServerApp } from '@stack/next';

    export const stack = new StackServerApp({
      tokenStore: "nextjs-cookie", // storing auth tokens in cookies
    });
    ```
  
    This will create a server app that handles all the server side functions. You can import it from other files to use the functions bind to it.

3. Create a new file and its parent folders in the Next.js app folder: `app/handler/[...stack]/page.tsx`. Then add the following code to the file: 

    ```tsx
    import { StackHandler } from "stack";
    import { stackServerApp } from "lib/stack";

    export default function Handler(props) {
      return <StackHandler app={stackServerApp} {...props} />;
    }
    ```

    The handler will be handle all the pages like `signin`, `signup`, `password-reset`, etc. automatically for you. You can later customize and change the route of these pages easily.


4. In your `app/layout.tsx`, add the `StackProvider`, it should look something like this:
    ```tsx
    import { StackProvider } from '@stack/next';
    import { stack } from 'lib/stack';

    export default function Layout({ children }) {
      return (
        <html lang="en">
          <body>
            <StackProvider app={stack}>
              {children}
            </StackProvider>
          </body>
        </html>
      );
    }
    ```

    The provider will provide information to the frontend functions and hooks.

5. That's it! Stack is not configured in your Next.js project. If you start your Next.js app with `npm run dev`, and navigate to `http://localhost:3000/handler/signup`, you should see the Stack signup page liek this:
    ![Stack sign up page](./imgs/signup-page.png)


## Next steps

Now you have a basic stack setup in your Next.js project and you can already access all the features like signup, signin, reset password, etc. In the next section, we will show you how to protect a page, get user information, and using functions like signout.