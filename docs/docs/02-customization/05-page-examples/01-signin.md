---
sidebar_position: 1
---

# Sign In

## Custom page with `SignIn` component

```tsx
'use client';
import { SignIn } from "@stackframe/stack";

export default function DefaultSignIn() {
  return <SignIn fullPage />;
}
```

You can also use `useUser` at the beginning of the sign in page to check if wether the user is already signed in and redirect them to some other page if they are.


## Other useful components

`CredentialSignIn`: A component that contains a form for signing in with email and password.

`OAuthGroup`: A list of available OAuth provider signin buttons components. The available provider list is fetched from the server.

`OAuthButton`: A single OAuth sign in button.


## Custom OAuth Sign In

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

## Custom Credential Sign In

```tsx
'use client';
import { useStackApp } from "@stackframe/stack";
import { useState } from "react";

export default function CustomCredentialSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const app = useStackApp();

  const onSubmit = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    // this will redirect to app.urls.afterSignIn if successful, you can customize it in the StackServerApp constructor
    const errorCode = await app.signInWithCredential({ email, password });
    // It is better to handle each error code separately, but we will just show the error code directly for simplicity here
    if (errorCode) {
      setError(errorCode.message);
    }
  };
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); } }>
      {error}
      <input type='email' placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type='password' placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type='submit'>Sign In</button>
    </form>
  );
}
```
