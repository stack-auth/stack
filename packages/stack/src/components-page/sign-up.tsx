'use client';
import AuthPage from './auth-page';

export default function SignUp({ fullPage=false }: { fullPage?: boolean }) {
  return <AuthPage fullPage={fullPage} type='sign-up' />;
}
