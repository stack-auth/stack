---
sidebar_position: 1
---

# Sign In

## Default Sign In Component

```tsx
'use client';
import { useStackApp, SignIn } from "stack";

export default function DefaultSignIn() {
  const app = useStackApp();

  return <SignIn fullPage redirectUrl={app.urls.userHome}/>;
}
```

Note that if you don't pass in a `redirectUrl`, the user will be redirected to the same page, which is useful if you want to build a sign in modal.


## Custom OAuth Sign In

```tsx
'use client';
import { useStackApp } from "stack";

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