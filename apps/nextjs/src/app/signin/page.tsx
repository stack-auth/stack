import { SignIn } from "stack";
import { stackServerApp } from "src/stack";
import CustomCredentialSignIn from "./custom-credential";
import CustomOAuthSignIn from "./custom-oauth";

export default function Page() {
  return <SignIn fullPage redirectUrl={stackServerApp.urls.home} />;
  // return <CustomCredentialSignIn />;
  // return <CustomOAuthSignIn />;
}
