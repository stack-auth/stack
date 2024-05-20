---
sidebar_position: 1
# sidebar_class_name: starred
---

# useStackApp

The `useStackApp` hook returns the `StackClientApp` object that you can use to interact with the Stack API. If you want to learn more about the `StackClientApp` object, check out the [App](./03-app.md) documentation.

Example:

```jsx
import { useStackApp } from "@stackframe/stack";

function MyComponent() {
  const stackApp = useStackApp();
  return <div>Sign In URL: {stackApp.urls.signIn}</div>;
}
```