import SignUp from "./sign-up";
import SignIn from "./sign-in";
import { RedirectType, notFound, redirect } from 'next/navigation';
import EmailVerification from "./email-verification";
import { PasswordReset, StackServerApp } from "..";
import MessageCard from "../components/message-cards/message-card";
import { HandlerUrls } from "../lib/stack-app";
import SignOut from "./sign-out";
import ForgotPassword from "./forgot-password";
import OAuthCallback from "./oauth-callback";
import AccountSettings from "./account-settings";
import MagicLinkCallback from "./magic-link-callback";
import ErrorPage from "./error-page";

export default async function StackHandler<HasTokenStore extends boolean>({
  app,
  params: { stack } = {},
  searchParams = {},
  // TODO set default to false like on the other components (may break old code)
  fullPage = "deprecated-unset",
}: { 
  app: StackServerApp<HasTokenStore>,
  params?: { stack?: string[] }, 
  searchParams?: Record<string, string>,
  fullPage?: boolean | "deprecated-unset",
}) {
  if (fullPage === "deprecated-unset") {
    console.warn("You are not passing `fullPage` to Stack's Handler. The default behaviour will soon change from `true` to `false`. Please update your Handler component in handler/[...stack]/page.tsx by adding the `fullPage` prop.");
    fullPage = true;
  }

  if (!stack) {
    return (
      <MessageCard title="Invalid Stack Handler Setup" fullPage={fullPage}>
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
      return <SignIn fullPage={fullPage} />;
    }
    case 'signup': {
      redirectIfNotHandler('signUp');
      await redirectIfHasUser();
      return <SignUp fullPage={fullPage} />;
    }
    case 'email-verification': {
      redirectIfNotHandler('emailVerification');
      return <EmailVerification searchParams={searchParams} fullPage={fullPage} />;
    }
    case 'password-reset': {
      redirectIfNotHandler('passwordReset');
      return <PasswordReset searchParams={searchParams} fullPage={fullPage} />;
    }
    case 'forgot-password': {
      redirectIfNotHandler('forgotPassword');
      return <ForgotPassword fullPage={fullPage} />;
    }
    case 'signout': {
      redirectIfNotHandler('signOut');
      return <SignOut fullPage={fullPage} />;
    }
    case 'oauth-callback': {
      redirectIfNotHandler('oauthCallback');
      return <OAuthCallback fullPage={fullPage} />;
    }
    case 'account-settings': {
      redirectIfNotHandler('accountSettings');
      return <AccountSettings fullPage={fullPage} />;
    }
    case 'magic-link-callback': {
      redirectIfNotHandler('magicLinkCallback');
      return <MagicLinkCallback searchParams={searchParams} fullPage={fullPage} />;
    }
    case 'error': {
      return <ErrorPage searchParams={searchParams} fullPage={fullPage} />;
    }
    default: {
      return notFound();
    }
  }
}
