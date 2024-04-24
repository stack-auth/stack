---
sidebar_position: 1
---

# User

## `CurrentUser` and `CurrentServerUser`

`CurrentUser` and `CurrentServerUser` provide functionalities like getting user profile, updating user information, send email verification, etc. `CurrentServerUser` is a subclass of `CurrentUser` and provides some additional functionalities like deleting users and server only metadata.

## `CurrentUser` Object

You can call `useUser()` or `stackApp.getUser()` to get the `CurrentUser` object.

### Properties

- `id`: The user ID. This is the unique identifier of the user.
- `displayName`: The display name of the user. Can be changed by the user.
- `primayEmail`: The primary email of the user. Note: this is not unique.
- `primaryEmailVerified`: Whether the primary email is verified.
- `profileImageUrl`: The profile image URL of the user.
- `signedUpAt`: The Date when the user signed up.
- `authWithEmail`: Whether the user has an email authentication method (magic link or password).
- `hasPassword`: Whether the user has a password set.
- `oauthProviders`: The list of OAuth provider ID s the user has connected.

### Methods

#### `update`

This method can update the user's profile information. Here is an example of how to update the user's display name:

```typescript
await user.update({
  displayName: "New Display Name",
});
```

#### `signOut`

This will sign out the user and clear the session.

```typescript
await user.signOut();
```

#### `sendEmailVerification`

This will send an email verification link to the user's primary email. It will return an error object (not throw an error) if the email is already verified. If successful, it will return undefined.

```typescript
const error = await user.sendEmailVerification();
if (error) {
  console.error("Error sending email verification", error);
} else {
  console.log("Email verification sent");
}
```

#### `updatePassword`

This will update the user's password. It will return an error object (not throw an error) if the passwords mismatch or if the new password does not meet the requirements. If successful, it will return undefined.
```typescript
const error = await user.updatePassword({
  currentPassword: "oldPassword",
  newPassword: "newPassword",
});
if (error) {
  console.error("Error updating password", error);
} else {
  console.log("Password updated");
}
```