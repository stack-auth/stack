---
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Users & Protected Pages

In [the last guide](./02-setup.md), we created `StackServerApp` and `StackProvider`. In this section, we will show you how to utilize them for accessing and modifying the current user information on Server Components and Client Components, respectively.

## Client Components

We can use the `useStackApp()` hook to get a `StackClientApp` object. With it, we can retrieve the current user in Client Components:

```tsx
"use client";
import { useStackApp } from "@stackframe/stack";

export function MyComponent() {
  const app = useStackApp();
  const user = app.useUser(); // or just import useUser and use it directly

  return <div>{user ? `Hello, ${user.displayName ?? "anon"}` : 'You are not logged in'}</div>;
}
```

Because it's so common, `useUser()` is also exposed as a standalone hook. This means that you can simply invoke `useUser()` as an alias for `useStackApp().useUser()`. (This is not true for other hooks; for example, you must call `useStackApp().useProject()` instead of `useProject()`.)

## Server Components

On Server Components, you don't need `useStackApp()`. Instead, you can just import the `StackServerApp` that you created in the previous chapter:

```tsx
import "server-only";
import { stackServerApp } from "@/stack";

export default async function MyComponent() {
  const user = await stackServerApp.getUser();

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
    import { stackServerApp } from "@/stack";

    export default async function Protected() {
      await stackServerApp.getUser({ or: 'redirect' });
      return <h1>You can only see this if you are logged in</h1>
    }
    ```
  </TabItem>
</Tabs>


## Signing out

You can sign out the user by redirecting them to `/handler/signout` or simply by calling `user.signOut()`. The user will be redirected to `afterSignOut` URL. you can customize it in the `StackServerApp` constructor (see [here](/docs/api-documentation/app)).


<Tabs>
  <TabItem value="client" label="user.signOut()" default>
    ```tsx
    "use client";
    import { useUser } from "@stackframe/stack";

    export default function SignOutButton() {
      const user = useUser();
      return <button onClick={user?.signOut}>
        Sign Out
      </button>;
    }
    ```
  </TabItem>

  <TabItem value="server" label="Redirect">
    ```tsx
    import { stackServerApp } from "@/stack";

    export default async function SignOutLink() {
      return <a href={stackServerApp.urls.signOut}>
        Sign Out
      </a>;
    }
    ```
  </TabItem>
</Tabs>


## Example Profile Page

Stack automatically creates a user profile on sign-up. Let's create a page that displays this information. In `app/profile/page.tsx`:

<Tabs>
  <TabItem value="client" label="Client Component" default>
    ```tsx
    'use client';
    import { useUser, useStackApp, UserButton } from "@stackframe/stack";

    export default function PageClient() {
      const user = useUser();
      const app = useStackApp();
      return (
        <div>
          {user ? (
            <div>
              <UserButton />
              <p>Welcome, {user.displayName}</p>
              <p>Your e-mail: {user.primaryEmail}</p>
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
    import { stackServerApp } from "@/stack";
    import { UserButton } from "@stackframe/stack";

    export default async function Page() {
      const user = await stackServerApp.getUser();
      return (
        <div>
          {user ? (
            <div>
              <UserButton />
              <p>Welcome, {user.displayName}</p>
              <p>Your e-mail: {user.primaryEmail}</p>
              <p><a href={stackServerApp.urls.signOut}>Sign Out</a></p>
            </div>
          ) : (
            <div>
              <p>You are not logged in</p>
              <p><a href={stackServerApp.urls.signIn}>Sign in</a></p>
              <p><a href={stackServerApp.urls.signUp}>Sign up</a></p>
            </div>
          )}
        </div>
      );
    }
    ```
  </TabItem>
</Tabs>

Note the `UserButton` is a component that you normally put in the top right corner of your page. It shows the user's profile picture (and optionally their name) and opens a dropdown with the user's profile, account settings, and sign-out button. It looks like this:

![UserButton](../imgs/user-button.png)

You will now be able to see the new profile page on [http://localhost:3000/profile](http://localhost:3000/profile).

To see more examples of how to use the `User` object, check out the [User API documentation](../03-api-documentation/01-user.md).

## Custom User Information

You can update the user's information by calling `user.update()` with the new data. The user data from the `userUser()` hook is automatically will also be updated automatically. Here is an example:

```tsx
'user client';
import { useUser } from "@stackframe/stack";

export default function UpdateUser() {
  const user = useUser();
  return <button onClick={async () => await user.update({ displayName: "New Name" })}>
    Change Name
  </button>;
}
```

You can store custom data in the `clientMetadata` field. Note that this data is visible on the client side and should not contain any sensitive information.

```tsx
await user.update({
  clientMetadata: {
    mailingAddress: "123 Main St",
  },
});
```

You can then get the `clientMetadata` field from the `User` object:

```tsx
const user = useUser();
console.log(user.clientMetadata);
```

If you want to store sensitive information that is only visible on the server side, you can use the `serverMetadata` field. This data will not be sent accessible on the client side. So you also have to use the `getUser()` on the `StackServerApp` to access this data.

```tsx
// server side only
import { stackServerApp } from "@/stack";
const user = await stackServerApp.getUser();
await user.update({
  serverMetadata: {
    secretInfo: "This is a secret",
  },
});
```

You can also access them from the `User` object:

```tsx
// server side only
import { stackServerApp } from "@/stack";
const user = await stackServerApp.getUser();
console.log(user.serverMetadata);
```

