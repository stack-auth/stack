'use client';
import { AuthPage } from './auth-page';

export function SignUp(props: { fullPage?: boolean, automaticRedirect?: boolean, extraInfo?: React.ReactNode }) {
  return <AuthPage fullPage={!!props.fullPage} type='sign-up' automaticRedirect={!!props.automaticRedirect} extraInfo={props.extraInfo} />;
}
