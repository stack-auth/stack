import { getRelativePart } from "@stackframe/stack-shared/dist/utils/urls";
import { RedirectType, notFound, redirect } from 'next/navigation';
import { SignIn, SignUp, StackServerApp } from "..";
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
import { FilterUndefined, filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";

type Components = {
  SignIn: typeof SignIn,
  SignUp: typeof SignUp,
  EmailVerification: typeof EmailVerification,
  PasswordReset: typeof PasswordReset,
  ForgotPassword: typeof ForgotPassword,
  SignOut: typeof SignOut,
  OAuthCallback: typeof OAuthCallback,
  MagicLinkCallback: typeof MagicLinkCallback,
  TeamInvitation: typeof TeamInvitation,
  ErrorPage: typeof ErrorPage,
  AccountSettings: typeof AccountSettings,
};


export default async function StackHandler<HasTokenStore extends boolean>(props: {
  app: StackServerApp<HasTokenStore>,
  params?: { stack?: string[] },
  searchParams?: Record<string, string>,
  fullPage: boolean,
  componentProps?: {
    [K in keyof Components]?: Parameters<Components[K]>;
  },
}) {
  if (!props.params?.stack) {
    return (
      <MessageCard title="Invalid Stack Handler Setup" fullPage={props.fullPage}>
        <p>Can't use Stack handler at this location. Make sure that the file is in a folder called [...stack].</p>
      </MessageCard>
    );
  }

  function redirectIfNotHandler(name: keyof HandlerUrls) {
    const url = props.app.urls[name];
    const handlerUrl = props.app.urls.handler;

    if (url !== handlerUrl && url.startsWith(handlerUrl + "/")) {
      // don't redirect if the url is a handler url
      return;
    }

    const urlObj = new URL(url, "http://example.com");
    for (const [key, value] of Object.entries(props.searchParams || {})) {
      urlObj.searchParams.set(key, value);
    }

    redirect(getRelativePart(urlObj), RedirectType.replace);
  };

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
    accountSettings: 'account-settings',
    error: 'error',
  };

  const path = props.params.stack.join('/');

  switch (path) {
    case availablePaths.signIn: {
      redirectIfNotHandler('signIn');
      return <SignIn
        fullPage={props.fullPage}
        automaticRedirect
        {...filterUndefinedINU(props.componentProps?.SignIn)}
      />;
    }
    case availablePaths.signUp: {
      redirectIfNotHandler('signUp');
      return <SignUp
        fullPage={props.fullPage}
        automaticRedirect
        {...filterUndefinedINU(props.componentProps?.SignUp)}
      />;
    }
    case availablePaths.emailVerification: {
      redirectIfNotHandler('emailVerification');
      return <EmailVerification
        searchParams={props.searchParams}
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.EmailVerification)}
      />;
    }
    case availablePaths.passwordReset: {
      redirectIfNotHandler('passwordReset');
      return <PasswordReset
        searchParams={props.searchParams || {}}
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.PasswordReset)}
      />;
    }
    case availablePaths.forgotPassword: {
      redirectIfNotHandler('forgotPassword');
      return <ForgotPassword
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.ForgotPassword)}
      />;
    }
    case availablePaths.signOut: {
      redirectIfNotHandler('signOut');
      return <SignOut
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.SignOut)}
      />;
    }
    case availablePaths.oauthCallback: {
      redirectIfNotHandler('oauthCallback');
      return <OAuthCallback
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.OAuthCallback)}
      />;
    }
    case availablePaths.magicLinkCallback: {
      redirectIfNotHandler('magicLinkCallback');
      return <MagicLinkCallback
        searchParams={props.searchParams || {}}
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.MagicLinkCallback)}
      />;
    }
    case availablePaths.teamInvitation: {
      redirectIfNotHandler('teamInvitation');
      return <TeamInvitation
        searchParams={props.searchParams || {}}
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.TeamInvitation)}
      />;
    }
    case availablePaths.accountSettings: {
      return <AccountSettings
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.AccountSettings)}
      />;
    }
    case availablePaths.error: {
      return <ErrorPage
        searchParams={props.searchParams || {}}
        fullPage={props.fullPage}
        {...filterUndefinedINU(props.componentProps?.ErrorPage)}
      />;
    }
    default: {
      for (const [key, value] of Object.entries(availablePaths)) {
        if (path === value.replaceAll('-', '')) {
          redirect(`${props.app.urls.handler}/${value}`, RedirectType.replace);
        }
      }
      return notFound();
    }
  }
}


function filterUndefinedINU<T extends {}>(value: T | undefined): FilterUndefined<T> | undefined {
  return value === undefined ? value : filterUndefined(value);
}
