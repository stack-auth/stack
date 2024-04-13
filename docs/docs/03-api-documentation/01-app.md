---
sidebar_position: 1
---

# App

## `StackServerApp` and `StackClientApp`

`StackClientApp` provides all the functionality you can use to build a client-side application with Stack, like `signInWithOAuth`, `useUser`, `useProject`, etc. You can get a `StackClientApp` object by calling `useStackApp()` in a Client Component.

`StackServerApp` is a subclass of `StackClientApp` that provides additional functionality for server side, like `getUser`, `getProject`, etc. To use your server app, you can just import the object from the file where you created it.

## Initialization

We showed in the [setup guide](/docs/getting-started/setup) that you can create a `StackServerApp` in a file like `lib/stack.ts` like this:

```tsx
import "server-only";
import { StackServerApp } from "@stackframe/stack";

export const stackApp = new StackServerApp({
  tokenStore: "nextjs-cookie", // storing auth tokens in cookies
});
```

Except for `tokenStore`, there are also a few other options you can pass to the `StackServerApp` constructor:

### `urls`

An object that contains some pre-defined URLs that Stack uses to route and redirect. You can override them for your own needs.

Example:

```tsx
export const stackApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/custom-sign-in",
    signUp: "/custom-sign-up",
    afterSignIn: "/user-profile",
    afterSignUp: "/onboarding",
  },
});
```


- `home`  
    Default: `"/"`  

    The URL of the home page.

-  `signIn`   
    Default: `"/handler/sign-in"`  

    The URL of the sign-in page.

- `afterSignIn`    
    Default: `"/"`

    The URL that the user will be redirected to after successful signing in. Note the OAuth sign-in will distiguish if a user is registerd before or not, and not based on from where the user is clicking the OAuth sign-in button.

- `signUp`    
    Default: `"/handler/sign-up"`  

    The URL of the sign-up page.

- `afterSignUp`   
    Default `"/"`

    The URL that the user will be redirected to after successful signing up. Note the OAuth sign-up will distiguish if a user is registerd before or not, and not based on from where the user is clicking the OAuth sign-up button.

- `signOut`   
    Default: `"/handler/sign-out"`  

    The URL of the sign-out page.

- `afterSignOut`   
    Default: `"/"`  

    The URL that the user will be redirected to after successful signing out.

- `emailVerification`   
    Default: `"/handler/email-verification"`

    The URL of the email verification page.

- `passwordReset`   
    Default `"/handler/password-reset"`

    The URL of the password reset page.

- `forgotPassword`   
    Default `"/handler/forgot-password"`

    The URL of the forgot password page.

- `handler`    
    Default: `"/handler"`  

    The URL of the handler root. If you want to change the URL of your handler to something other than `/handler`, you can change it here. 

    Note that you also need to change the `[...stack]/page.tsx` file to the corresponding location. When you want to use your website in a non-local environment, you need to change the handler URL in the Stack dashboard as well.
