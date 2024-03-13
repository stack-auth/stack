---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Users & Protected Pages

In [the last guide](/docs/getting-started/setup), we created `StackServerApp` and `StackProvider`. In this section, we will show you how to utilize them for accessing and modifying the current user information on Server Components and Client Components, respectively.

## Client Components

We can use the `useStackApp()` hook to get a `StackClientApp` object. With it, we can retrieve the current user in Client Components:

```tsx
"use client";
import { useStackApp } from "@stackframe/stack";

export function MyComponent() {
  const app = useStackApp();
  const user = app.useUser();

  return <div>{user ? `Hello, ${user.displayName ?? "anon"}` : 'You are not logged in'}</div>;
}
```

Because it's so common, `useUser()` is also exposed as a standalone hook. This means that you can simply invoke `useUser()` as an alias for `useStackApp().useUser()`. (This is not true for other hooks; for example, you must call `useStackApp().useProject()` instead of `useProject()`.)

## Server Components

On Server Components, you don't need `useStackApp()`. Instead, you can just import the `StackServerApp` that you created in the previous chapter:

```tsx
import "server-only";
import { stackApp } from "@/lib/stack";

export default async function MyComponent() {
  const user = await stackApp.getUser();

  return <div>{user ? `Hello, ${user.displayName ?? "anon"}` : 'You are not logged in'}</div>;
}
```

:::info

The difference between `getUser()` and `useUser()` is that `useUser()` will re-render the component when the user changes (for example on signout), while `getUser()` will only fetch the user once. Since Server Components cannot re-render, `useUser()` cannot be used there. 

:::


## Protecting a page

Call `useUser` (or `getUser`) with the `{ or: 'redirect' }` option to protect the page. If the user is not logged in, they will be redirected to the sign-in page.

<Tabs>
  <TabItem value="client" label="Client Component" default>
    ```tsx
    "use client";
    import { useUser } from "@stackframe/stack";

    export default function Protected() {
      useUser({ or: 'redirect' });
      return <h1>You can only see this if you are logged in</h1>
    }
    ```
  </TabItem>

  <TabItem value="server" label="Server Component">
    ```tsx
    import { stackApp } from "@/lib/stack";

    export default async function Protected() {
      await stackApp.getUser({ or: 'redirect' });
      return <h1>You can only see this if you are logged in</h1>
    }
    ```
  </TabItem>
</Tabs>


## Signing out

You can sign out the user by redirecting them to `/handler/signout` or simply by calling `user.signOut()`.


<Tabs>
  <TabItem value="client" label="user.signOut()" default>
    ```tsx
    "use client";
    import { useUser } from "@stackframe/stack";

    export default function SignOutButton() {
      const user = useUser();
      return <button onClick={async () => {
        await user?.signOut();
      }>
        Sign Out
      </button>;
    }
    ```
  </TabItem>

  <TabItem value="server" label="Redirect">
    ```tsx
    import { stackApp } from "@/lib/stack";

    export default async function SignOutLink() {
      return <a href={stackApp.urls.signOut}>
        Sign Out
      </a>;
    }
    ```
  </TabItem>
</Tabs>


## Examples

### User profile

Stack automatically creates a user profile on sign-up. Let's create a page that displays this information. In `app/profile/page.tsx`:

<Tabs>
  <TabItem value="client" label="Client Component" default>
    ```tsx
    'use client';
    import { useUser, useStackApp } from "@stackframe/stack";

    export default function PageClient() {
      const user = useUser();
      const app = useStackApp();
      return (
        <div>
          <h1>Home</h1>
          {user ? (
            <div>
              <p>Welcome, {user.displayName}</p>
              <p>Your e-mail: {user.primaryEmail}</p>
              <p>Your e-mail verification status: {user.primaryEmailVerified.toString()}</p>
              <button onClick={() => user.signOut()}>Sign Out</button>
            </div>
          ) : (
            <div>
              <p>You are not logged in</p>
              <button onClick={() => app.redirectToSignIn()}>Sign in</button>
              <button onClick={() => app.redirectToSignUp()}>Sign up</button>
            </div>
          )}
        </div>
      );
    }
    ```
  </TabItem>

  <TabItem value="server" label="Server Component">
    ```tsx
    import { stackApp } from "@/lib/stack";

    export default async function Page() {
      const user = await stackApp.getUser();
      return (
        <div>
          <h1>Home</h1>
          {user ? (
            <div>
              <p>Welcome, {user.displayName}</p>
              <p>Your e-mail: {user.primaryEmail}</p>
              <p>Your e-mail verification status: {user.primaryEmailVerified.toString()}</p>
              <p><a href={stackApp.urls.signOut}>Sign Out</a></p>
            </div>
          ) : (
            <div>
              <p>You are not logged in</p>
              <p><a href={stackApp.urls.signIn}>Sign in</a></p>
              <p><a href={stackApp.urls.signUp}>Sign up</a></p>
            </div>
          )}
        </div>
      );
    }
    ```
  </TabItem>
</Tabs>

You will now be able to see the new profile page on http://localhost:3000/profile.
