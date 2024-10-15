import { OAuthButton } from '@stackframe/stack';

export default function Page() {
  return (
    <div>
      <h1>Sign In</h1>
      <OAuthButton provider="google" type="sign-in" />
    </div>
  );
}
