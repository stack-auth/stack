---
sidebar_position: 1
---

# Sign Up

## Custom page with `SignUp` component

```tsx
'use client';
import { useStackApp, SignUp } from "@stackframe/stack";

export default function DefaultSignUp() {
  const app = useStackApp();

  return <SignIn fullPage />;
}
```

You can also use `useUser` at the beginning of the sign in page to check if wether the user is already signed in and redirect them to some other page if they are. 

## Other useful components

`CredentialSignUp`: A component that contains a form for signing in with email and password.

`PasswordField`: password input field with show/hide password button.

`OAuthGroup`: A list of available OAuth provider sign-up buttons components. The available provider list is fetched from the server.

`OAuthButton`: A single OAuth sign-up button.

## Custom OAuth Sign Up

```tsx
'use client';
import { useStackApp } from "@stackframe/stack";

export default function CustomOAuthSignUp() {
  const app = useStackApp();

  return <div>
    <h1>My Custom Sign Up page</h1>
    <button onClick={async () => {
      // this will redirect to the OAuth provider's login page
      await app.signInWithOAuth('google');
    }}>
      Sign Up with Google
    </button>
  </div>;
}
```