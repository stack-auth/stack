---
sidebar_position: 1
# sidebar_class_name: starred
---

# useUser

`useUser` is a hook that returns the user object if the user is authenticated; otherwise, it returns `null` by default. However, if you pass in `{ or: "redirect" }` or `{ or: "throw" }` as an option, it will redirect to the login page or throw an error respectively when the user is not authenticated.

If you want to learn more about the `User` object, check out the [User](./02-user.md) documentation.

## Default Usage

Check if the user is authenticated and display the user's name.
```jsx
import { useUser } from "@stackframe/stack";

function MyComponent() {
  const user = useUser(); // user can be null
  if (!user) {
    return <div>Not authenticated</div>;
  }
  return <div>Hello, {user.name}</div>;
}
```

## Redirect when not authenticated
By passing `{ or: "redirect" }` to the hook, it will redirect to the login page if the user is not authenticated. You can configure the login page in the StackApp component.
```jsx
import { useUser } from "@stackframe/stack";

function MyComponent() {
  const user = useUser({ or: "redirect" }); // user is garanteed to be non-null
  return <div>Hello, {user.name}</div>;
}
```

The same hook can also be used to protect a page. (You might also want to check out the server-side version [here](/docs/getting-started/users))
```jsx
import { useUser } from "@stackframe/stack";

function MyProtectedPage() {
  useUser({ or: "redirect" });
  return <div>You can only see this if you are authenticated</div>;
}
```

## Throw an error when not authenticated

By passing `{ or: "throw" }` into the hook, it will throw an error if the user is not authenticated. This can be used for places where the user should never be unauthenticated if the app is working correctly.
```jsx
import { useUser } from "@stackframe/stack";

function MyComponent() {
  // user is garanteed to be non-null, but an error will be thrown if the user is not authenticated
  const user = useUser({ or: "throw" }); 

  return <div>Hello, {user.name}</div>;
}
