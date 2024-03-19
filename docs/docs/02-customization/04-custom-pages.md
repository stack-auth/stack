---
sidebar_position: 1
---

# Custom Pages

By default, `StackHandler` creates all pages you need. You can customize the [colors](/docs/customization/custom-colors) and [components](/docs/customization/custom-components) here. However, if you'd like full control of the layout and logic flow, you can always use our built-in components to build your own pages or use even star from strach using low-level functions. 

## Simple Example

Let's say that you built a custom sign-in page like this in `app/signin/page.tsx`:

```tsx
import { SignIn } from "@stackframe/stack";

export default function CustomSignInPage() {
  return <div>
    <h1>My Custom Sign In page</h1>
    <SignIn />
  </div>;
}
```

Then you can instruct the Stack app in `lib/stack.ts` to use your custom sign in page:

```tsx
export const stackApp = new StackServerApp({
  // ...
  // add these three lines
  urls: {
    signIn: '/signin',
  }
});
```

You are now all set! If you visit the `/signin` page, you should see your custom sign in page. If your user visits a protected page or the old `/handler/signin` URL, they will be redirected to your new sign-in page.

For more examples, please refer to the [Examples](/docs/category/page-examples).


## From scratch

We also provide the low-level functions powering our components, so that you can build your own logic. For example, to build a custom OAuth sign-in button, create a file at `app/signin/page.tsx`:

```tsx
'use client';
import { useStackApp } from "@stackframe/stack";

export default function CustomOAuthSignIn() {
  const app = useStackApp();

  return <div>
    <h1>My Custom Sign In page</h1>
    <button onClick={async () => {
      // this will redirect to the OAuth provider's login page
      await app.signInWithOAuth('google');
    }}>
      Sign In with Google
    </button>
  </div>;
}
```

Again, edit the Stack app in `lib/stack.ts` to use your custom sign in page:

```tsx
export const stackApp = new StackServerApp({
  // ...
  // add these three lines
  urls: {
    signIn: '/signin',
  }
});
```

As above, visit the `/signin` page to see your newly created custom OAuth page.


## Next steps

Take a look at the [customization examples](/docs/category/page-examples) to see how to build custom pages for sign in, sign up, reset password, and more.
