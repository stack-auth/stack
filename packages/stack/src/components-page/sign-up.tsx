'use client';
import { AuthPage } from './auth-page';

export function SignUp({ fullPage=false, automaticRedirect }: { fullPage?: boolean, automaticRedirect?: boolean }) {
  return <AuthPage fullPage={fullPage} type='sign-up' automaticRedirect={automaticRedirect} />;
}
