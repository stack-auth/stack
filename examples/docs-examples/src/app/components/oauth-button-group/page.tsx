import { OAuthButtonGroup } from '@stackframe/stack';

export default function Page() {
  return (
    <div>
      <h1>Sign In</h1>
      <OAuthButtonGroup type='sign-in' />
    </div>
  );
}
