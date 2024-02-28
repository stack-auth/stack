---
sidebar_position: 3
---

# Custom Pages

Stack handler automatically creates all the pages you need with a good default design, so you can get started very quickly without any extra setup. However, if you want to customize the look or even have some special logic, you can create your own pages and tell the handler to redirect to your pages instead.

## Custom OAuth sign in page

Here we show an example of how to create a simple custom OAuth sign in page. For demostration purpose, we won't style it, but you can choose your favorite UI framework and make it look good! If you want to know how to build other custome pages like credential sign in, signup, or reset password, you can find detailed information of all the pages are in the [Custom Pages](/docs/category/pages) section. 

Create a new file `app/signin/page.tsx` and add the following code:

```tsx
'use client';
import { useStackApp } from "stack";

export default function CustomOAuthSignIn() {
  const app = useStackApp();

  return <div>
    <h1>My Custom Sign In page</h1>
    <button onClick={async () => await app.signInWithOauth('google')}>Sign In with Google</button>
  </div>;
}
```

Now, to let the handler know that you are going to use your custom sign in page, you need to setup the url in the `StackServerApp`, which should locate in `lib/stack.ts` if you followed the previous tutorial:

```tsx
import { StackServerApp } from '@stack/next';

export const stack = new StackServerApp({
  urls: {
    signIn: '/signin',
  }
});
```

You are now all set! If you visit the `/signin` page, you should see your custom sign in page. Also when the user goes to a protected page, stack will automatically redirect you to your custom sign in page.
