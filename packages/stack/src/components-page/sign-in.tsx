import { AuthPage } from "./auth-page";

export function SignIn({ fullPage = false }: { fullPage?: boolean }) {
  return <AuthPage fullPage={fullPage} type="sign-in" />;
}
