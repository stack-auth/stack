import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";
import { StyledLink } from "@/components/link";

export default function Handler(props: any) {
  const extraInfo = <>By signing in, you agree to the <StyledLink href="https://www.iubenda.com/privacy-policy/19290387/cookie-policy">Terms of Service</StyledLink> and <StyledLink href="https://www.iubenda.com/privacy-policy/19290387">Privacy Policy</StyledLink></>;
  return <StackHandler
    fullPage {...props}
    app={stackServerApp}
    componentProps={{ SignIn: { extraInfo }, SignUp: { extraInfo } }}
  />;
}
