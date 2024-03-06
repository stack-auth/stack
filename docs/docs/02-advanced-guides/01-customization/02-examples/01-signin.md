---
sidebar_position: 1
---

# Sign In

## Custom page with `SignIn` component

```tsx
'use client';
import { useStackApp, SignIn } from "@stackframe/stack";

export default function DefaultSignIn() {
  const app = useStackApp();

  return <SignIn fullPage redirectUrl={app.urls.userHome} />;
}
```

`redirectUrl` is the url the user will be redirected to after successful signing in. It is optional and defaults to the current page. 

You can also use `useUser` at the beginning of the sign in page to check if wether the user is already signed in and redirect them to some other page if they are.


## Other useful components

`CredentialSignIn`: A component that contains a form for signing in with email and password.

`PasswordField`: password input field with show/hide password button.

`OAuthGroup`: A list of available OAuth provider signin buttons components. The available provider list is fetched from the server.

`OAuthButton`: A single OAuth sign in button.


## Custom OAuth Sign In

```tsx
'use client';
import { useStackApp } from "@stackframe/stack";

export default function CustomOAuthSignIn() {
  const app = useStackApp();

  return <div>
    <button onClick={async () => await app.signInWithOauth({ 
      provider: 'google', 
      redirectUrl: app.urls.userHome
    })}>Sign In with Google</button>
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
    const errorCode = await app.signInWithCredential({ email, password, redirectUrl: app.urls.userHome });
    // It is better to handle each error code separately, but for simplicity in this example, we will just show the error code directly
    if (errorCode) {
      setError(errorCode);
    }
  };
  
  return (
    <div>
      {error}
      <input type='email' placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type='password' placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={onSubmit}>Sign In</button>
    </div>
  );
}
```
