---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# User and Protect Page

## User information page

Let's create a home page which will show the user name and a log out button when the user is logged in, and links to the login and signup when the user is not logged in. Let's create a page in `app/page.tsx`. 

Note that if you are using client component, you have to put this in a separate file like `apps/page-client.tsx` and import it in the `app/page.tsx` file.

<Tabs>
  <TabItem value="client" label="Client Component" default>
```tsx
'use client';
import { useUser, redirectToSignIn, redirectToSignUp, signOut } from '@stack/next';

export default function Home() {
  const user = useUser();
  return (
    <div>
      <h1>Home</h1>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <p>You are not logged in</p>
          <button onClick={redirectToSignIn}>Sign in</button>
          <button onClick={redirectToSignUp}>Sign up</button>
        </div>
      )}
    </div>
  );
}
```
  </TabItem>

  <TabItem value="server" label="Server Component">
```tsx
import { stack } from '../lib/stack';

export default function Page() {
  const user = await stack.getUser();
  return (
    <div>
      <h1>Home</h1>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}</p>
          <a href={stack.signOutUrl}>Sign Out</a>
        </div>
      ) : (
        <div>
          <p>You are not logged in</p>
          <a href={stack.signInUrl}>Sign in</a>
          <a href={stack.signUpUrl}>Sign up</a>
        </div>
      )}
    </div>
  );
}
```
  </TabItem>
</Tabs>

Now if you navigate to `http://localhost:3000`, you should see the home page.

## Protect a page

If you want to protect a page so that only logged in users can access it, you can add `{ or: 'redirect' }` to the `useUser` hook or `stack.getUser` function. Here is an example server side example:

<Tabs>
  <TabItem value="client" label="Client Component" default>
```tsx
'use client';
import { useUser, redirectToSignIn } from '@stack/next';

export default function Protected() {
  useUser({ or: 'redirect' });
  return <h1>You can only see this if you are logged in</h1>
}
```
  </TabItem>

  <TabItem value="server" label="Server Component">
```tsx
import { stack } from '../lib/stack';

export default function Protected() {
  await stack.getUser({ or: 'redirect' });
  return <h1>You can only see this if you are logged in</h1>
}
```
  </TabItem>
</Tabs>

## Next steps

Now you have a basic stack setup in your Next.js project and you also know how to use and interact with the stack functions. In the next sections, we will show how to customize or create your own custom pages and how to use stack in your backend server.



