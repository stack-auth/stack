import SignUp from "./SignUp";
import SignIn from "./SignIn";
import { RedirectType, notFound, redirect } from 'next/navigation';
import EmailVerification from "./EmailVerification";
import { PasswordReset, StackServerApp } from "..";
import MessageCard from "../elements/MessageCard";
import { HandlerUrls } from "../lib/stack-app";
import Signout from "./SignOut";
import ForgotPassword from "./ForgotPassword";
import OAuthCallback from "./OAuthCallback";

export default async function StackHandler<HasTokenStore extends boolean>({
  app,
  params: { stack } = {},
  searchParams = {},
}: { 
  app: StackServerApp<HasTokenStore>,
  params?: { stack?: string[] }, 
  searchParams?: Record<string, string>,
}) {
  if (!stack) {
    return (
      <MessageCard title="Invalid Stack Handler Setup" fullPage>
        <p>Can't use Stack handler at this location. Make sure that the file is in a folder called [...stack].</p>
      </MessageCard>
    );
  }

  function redirectIfNotHandler(name: keyof HandlerUrls) {
    const url = app.urls[name];
    const handlerUrl = app.urls.handler;

    if (url.startsWith(handlerUrl)) {
      // don't redirect if the url is a handler url
      return;
    }

    redirect(url, RedirectType.replace);
  }

  const path = stack.join('/');
  switch (path) {
    case 'signin': {
      redirectIfNotHandler('signIn');
      return <SignIn fullPage redirectUrl={app.urls.userHome}/>;
    }
    case 'signup': {
      redirectIfNotHandler('signUp');
      return <SignUp fullPage redirectUrl={app.urls.userHome}/>;
    }
    case 'email-verification': {
      redirectIfNotHandler('emailVerification');
      return <EmailVerification searchParams={searchParams} fullPage redirectUrl={app.urls.signIn} />;
    }
    case 'password-reset': {
      redirectIfNotHandler('passwordReset');
      return <PasswordReset searchParams={searchParams} fullPage />;
    }
    case 'forgot-password': {
      redirectIfNotHandler('forgotPassword');
      return <ForgotPassword fullPage />;
    }
    case 'signout': {
      redirectIfNotHandler('signOut');
      return <Signout redirectUrl={app.urls.home} />;
    }
    case 'oauth-callback': {
      redirectIfNotHandler('oauthCallback');
      return <OAuthCallback />;
    }
    default: {
      return notFound();
    }
  }
}
