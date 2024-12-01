import { FilterUndefined, filterUndefined, pick } from "@stackframe/stack-shared/dist/utils/objects";
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

type RouteProps = {
  params: Promise<{ stack?: string[] }> | { stack?: string[] },
  searchParams: Promise<Record<string, string>> | Record<string, string>,
};

const next15DeprecationWarning = "DEPRECATION WARNING: Next.js 15 disallows spreading the props argument of <StackHandler /> like `{...props}`, so you must now explicitly pass them in the `routeProps` argument: `routeProps={props}`";

export default async function StackHandler<HasTokenStore extends boolean>(props: {
  app: StackServerApp<HasTokenStore>,
  fullPage: boolean,
  componentProps?: {
    [K in keyof Components]?: Parameters<Components[K]>[0];
  },
} & (
  | Partial<RouteProps>
  | {
    routeProps: RouteProps | unknown,
  }
)): Promise<any> {
  if (!("routeProps" in props)) {
    console.warn(next15DeprecationWarning);
  }

  const routeProps = "routeProps" in props ? props.routeProps as RouteProps : pick(props, ["params", "searchParams"] as any);
  const params = await routeProps.params;
  const searchParams = await routeProps.searchParams;
  if (!params?.stack) {
    return (
      <MessageCard title="Invalid Stack Handler Setup" fullPage={props.fullPage}>
        <p>Can't use {"<StackHandler />"} at this location. Make sure that the file is in a folder called [...stack] and you are passing the routeProps prop.</p>
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
    for (const [key, value] of Object.entries(routeProps.searchParams || {})) {
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

  const path = params.stack.join('/');

  const render = () => {
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
          searchParams={searchParams}
          fullPage={props.fullPage}
          {...filterUndefinedINU(props.componentProps?.EmailVerification)}
        />;
      }
      case availablePaths.passwordReset: {
        redirectIfNotHandler('passwordReset');
        return <PasswordReset
          searchParams={searchParams || {}}
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
          searchParams={searchParams || {}}
          fullPage={props.fullPage}
          {...filterUndefinedINU(props.componentProps?.MagicLinkCallback)}
        />;
      }
      case availablePaths.teamInvitation: {
        redirectIfNotHandler('teamInvitation');
        return <TeamInvitation
          searchParams={searchParams || {}}
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
          searchParams={searchParams || {}}
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
  };

  return <>
    {process.env.NODE_ENV === "development" && !("routeProps" in props) && (
      <span style={{ color: "red" }}>
        {next15DeprecationWarning}. This warning will not be shown in production.
      </span>
    )}
    {render()}
  </>;
}


function filterUndefinedINU<T extends {}>(value: T | undefined): FilterUndefined<T> | undefined {
  return value === undefined ? value : filterUndefined(value);
}
