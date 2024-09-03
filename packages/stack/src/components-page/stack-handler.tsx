import { getRelativePart } from "@stackframe/stack-shared/dist/utils/urls";
import { RedirectType, notFound, redirect } from 'next/navigation';
import { AuthPage, StackServerApp } from "..";
import { MessageCard } from "../components/message-cards/message-card";
import { HandlerUrls } from "../lib/stack-app";
import { AccountSettings } from "./account-settings";
import { EmailVerification } from "./email-verification";
import { ErrorPage } from "./error-page";
import { ForgotPassword } from "./forgot-password";
import { MagicLinkCallback } from "./magic-link-callback";
import { OAuthCallback } from "./oauth-callback";
import { PasswordReset } from "./password-reset";
import { SignOut } from "./sign-out";
import { TeamInvitation } from "./team-invitation";

export default async function StackHandler<HasTokenStore extends boolean>({
  app,
  params: { stack } = {},
  searchParams = {},
  fullPage,
}: {
  app: StackServerApp<HasTokenStore>,
  params?: { stack?: string[] },
  searchParams?: Record<string, string>,
  fullPage?: boolean,
}) {
  if (fullPage === undefined) {
    console.warn("Not specifying `fullPage` in the StackHandler options is deprecated; the default value will change to `false` in the next major version. Please specify `fullPage={true}` in your `app/[...stack]/handler/page.tsx` file to retain the current behavior.");
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

    if (url !== handlerUrl && url.startsWith(handlerUrl + "/")) {
      // don't redirect if the url is a handler url
      return;
    }

    const urlObj = new URL(url, "http://example.com");
    for (const [key, value] of Object.entries(searchParams)) {
      urlObj.searchParams.set(key, value);
    }

    redirect(getRelativePart(urlObj), RedirectType.replace);
  }

  const availablePaths = {
    signIn: 'sign-in',
    signUp: 'sign-up',
    emailVerification: 'email-verification',
    passwordReset: 'password-reset',
    forgotPassword: 'forgot-password',
    signOut: 'sign-out',
    oauthCallback: 'oauth-callback',
    magicLinkCallback: 'magic-link-callback',
    teamInvitation: 'team-invitation',
    error: 'error',
  };

  const path = stack.join('/');

  if (path.startsWith('account-settings')) {
    return <AccountSettings />;
  }


  switch (path) {
    case availablePaths.signIn: {
      redirectIfNotHandler('signIn');
      return <AuthPage fullPage={fullPage} type='sign-in' automaticRedirect />;
    }
    case availablePaths.signUp: {
      redirectIfNotHandler('signUp');
      return <AuthPage fullPage={fullPage} type='sign-up' automaticRedirect />;
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
    case availablePaths.magicLinkCallback: {
      redirectIfNotHandler('magicLinkCallback');
      return <MagicLinkCallback searchParams={searchParams} fullPage={fullPage} />;
    }
    case availablePaths.teamInvitation: {
      redirectIfNotHandler('teamInvitation');
      return <TeamInvitation searchParams={searchParams} fullPage={fullPage} />;
    }
    case availablePaths.error: {
      return <ErrorPage searchParams={searchParams} fullPage={fullPage} />;
    }
    default: {
      for (const [, value] of Object.entries(availablePaths)) {
        if (path === value.replaceAll('-', '')) {
          redirect(`${app.urls.handler}/${value}`, RedirectType.replace);
        }
      }
      return notFound();
    }
  }
}
