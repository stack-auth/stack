import { SignUp } from "./sign-up";
import { SignIn } from "./sign-in";
import { RedirectType, notFound, redirect } from 'next/navigation';
import { EmailVerification } from "./email-verification";
import { StackServerApp } from "..";
import { MessageCard } from "../components/message-cards/message-card";
import { HandlerUrls } from "../lib/stack-app";
import { SignOut } from "./sign-out";
import { ForgotPassword } from "./forgot-password";
import { OAuthCallback } from "./oauth-callback";
import { AccountSettings } from "./account-settings";
import { MagicLinkCallback } from "./magic-link-callback";
import { ErrorPage } from "./error-page";
import { PasswordReset } from "./password-reset";

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
    const user = await app.getUser();
    if (user) {
      redirect(app.urls.afterSignIn);
    }
  }

  const availablePaths = {
    signIn: 'sign-in',
    signUp: 'sign-up',
    emailVerification: 'email-verification',
    passwordReset: 'password-reset',
    forgotPassword: 'forgot-password',
    signOut: 'sign-out',
    oauthCallback: 'oauth-callback',
    accountSettings: 'account-settings',
    magicLinkCallback: 'magic-link-callback',
    error: 'error',
  };

  const path = stack.join('/');
  switch (path) {
    case availablePaths.signIn: {
      redirectIfNotHandler('signIn');
      await redirectIfHasUser();
      return <SignIn fullPage={fullPage} />;
    }
    case availablePaths.signUp: {
      redirectIfNotHandler('signUp');
      await redirectIfHasUser();
      return <SignUp fullPage={fullPage} />;
    }
    case availablePaths.emailVerification: {
      redirectIfNotHandler('emailVerification');
      return <EmailVerification searchParams={searchParams} fullPage={fullPage} />;
    }
    case availablePaths.passwordReset: {
      redirectIfNotHandler('passwordReset');
      return <PasswordReset searchParams={searchParams} fullPage={fullPage} />;
    }
    case availablePaths.forgotPassword: {
      redirectIfNotHandler('forgotPassword');
      return <ForgotPassword fullPage={fullPage} />;
    }
    case availablePaths.signOut: {
      redirectIfNotHandler('signOut');
      return <SignOut fullPage={fullPage} />;
    }
    case availablePaths.oauthCallback: {
      redirectIfNotHandler('oauthCallback');
      return <OAuthCallback fullPage={fullPage} />;
    }
    case availablePaths.accountSettings: {
      redirectIfNotHandler('accountSettings');
      return <AccountSettings fullPage={fullPage} />;
    }
    case availablePaths.magicLinkCallback: {
      redirectIfNotHandler('magicLinkCallback');
      return <MagicLinkCallback searchParams={searchParams} fullPage={fullPage} />;
    }
    case availablePaths.error: {
      return <ErrorPage searchParams={searchParams} fullPage={fullPage} />;
    }
    default: {
      for (const [key, value] of Object.entries(availablePaths)) {
        if (path === value.replaceAll('-', '')) {
          redirect(`${app.urls.handler}/${value}`, RedirectType.replace);
        }
      }
      return notFound();
    }
  }
}
