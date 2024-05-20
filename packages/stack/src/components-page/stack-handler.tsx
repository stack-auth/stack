import SignUp from "./sign-up";
import SignIn from "./sign-in";
import { RedirectType, notFound, redirect } from 'next/navigation';
import EmailVerification from "./email-verification";
import { PasswordReset, StackServerApp } from "..";
import MessageCard from "../components/message-card";
import { HandlerUrls } from "../lib/stack-app";
import SignOut from "./sign-out";
import ForgotPassword from "./forgot-password";
import OAuthCallback from "./oauth-callback";
import AccountSettings from "./account-settings";
import MagicLinkCallback from "./magic-link-callback";

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

  async function redirectIfHasUser() {
    const user = await app.getServerUser();
    if (user) {
      redirect(app.urls.afterSignIn);
    }
  }

  const path = stack.join('/');
  switch (path) {
    case 'signin': {
      redirectIfNotHandler('signIn');
      await redirectIfHasUser();
      return <SignIn fullPage/>;
    }
    case 'signup': {
      redirectIfNotHandler('signUp');
      await redirectIfHasUser();
      return <SignUp fullPage/>;
    }
    case 'email-verification': {
      redirectIfNotHandler('emailVerification');
      return <EmailVerification searchParams={searchParams} fullPage/>;
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
      return <SignOut/>;
    }
    case 'oauth-callback': {
      redirectIfNotHandler('oauthCallback');
      return <OAuthCallback />;
    }
    case 'account-settings': {
      redirectIfNotHandler('accountSettings');
      return <AccountSettings fullPage />;
    }
    case 'magic-link-callback': {
      redirectIfNotHandler('magicLinkCallback');
      return <MagicLinkCallback searchParams={searchParams} fullPage />;
    }
    default: {
      return notFound();
    }
  }
}
