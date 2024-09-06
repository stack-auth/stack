import { AuthPage } from './auth-page';

export function SignIn({ fullPage=false, automaticRedirect }: { fullPage?: boolean, automaticRedirect?: boolean }) {
  return <AuthPage fullPage={fullPage} type='sign-in' automaticRedirect={automaticRedirect} />;
}
