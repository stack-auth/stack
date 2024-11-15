import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";
import { StyledLink } from "@/components/link";

export default function Handler(props: unknown) {
  const extraInfo = <>
    <p className="text-xs">By signing in, you agree to the</p>
    <p className="text-xs"><StyledLink href="https://www.iubenda.com/privacy-policy/19290387/cookie-policy">Terms of Service</StyledLink> and <StyledLink href="https://www.iubenda.com/privacy-policy/19290387">Privacy Policy</StyledLink></p>
  </>;
  return <StackHandler
    fullPage
    routeProps={props}
    app={stackServerApp}
    componentProps={{ SignIn: { extraInfo }, SignUp: { extraInfo } }}
  />;
}
