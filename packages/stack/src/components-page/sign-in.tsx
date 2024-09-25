import { AuthPage } from './auth-page';

export function SignIn(props: { fullPage?: boolean, automaticRedirect?: boolean, reverseOrder?: boolean, extraInfo?: React.ReactNode }) {
  return <AuthPage fullPage={!!props.fullPage} type='sign-in' automaticRedirect={!!props.automaticRedirect} reverseOrder={props.reverseOrder} extraInfo={props.extraInfo} />;
}
