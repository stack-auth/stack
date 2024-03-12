---
sidebar_position: 1
title: Overview
---

# Customization Overview

Stack provides two ways to customize the UI:

- **CSS customization**: You can modify default UI looks by overriding the styles of class names beginning with `wl_`, such as `wl_btn`.
- **Custom pages**: You can create custom pages for sign in, sign up, reset password and more, thanks to built-in components.
- **From scratch**: If you need even more flexibility, you can always reimplement our components from scratch with the helper functions that we provide.

## CSS customization

You can modify the default UI looks by overriding the styles of class names beginning with `wl_`, such as `wl_btn`. (Please stay tuned — we're updating this part of the documentation!)

## Custom pages

By default, `StackHandler` creates all pages you need. However, if you'd like a bit of additional control, you can always use our built-in components (such as `<SignIn />`) to build your own pages for all features. For example, if you have the following in `app/signin/page.tsx`:

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

For more examples, please refer to the [Examples](/docs/category/examples).


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

Take a look at the [customization examples](/docs/category/examples) to see how to build custom pages for sign in, sign up, reset password, and more.
