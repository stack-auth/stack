'use client';
import AuthPage from './auth-page';

export default function SignIn({ fullPage=false }: { fullPage?: boolean }) {
  return <AuthPage fullPage={fullPage} type='sign-in' />;
}
