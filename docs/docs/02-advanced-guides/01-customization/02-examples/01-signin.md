---
sidebar_position: 1
---

# Sign In

## Custom page with `SignIn` component

```tsx
'use client';
import { useStackApp, SignIn } from "stack";

export default function DefaultSignIn() {
  const app = useStackApp();

  return <SignIn fullPage redirectUrl={app.urls.userHome} />;
}
```

`redirectUrl` is optional and defaults to the current page.


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
