export { default as StackProvider } from "./providers/stack-provider";
export { useUser, useStackApp } from "./lib/hooks";
export { default as StackHandler } from "./components-page/stack-handler";
export { StackTheme } from './providers/theme-provider';
export * from './lib/stack-app';

export { SignIn } from "./components-page/sign-in";
export { SignUp } from "./components-page/sign-up";
export { EmailVerification } from "./components-page/email-verification";
export { PasswordReset } from "./components-page/password-reset";
export { ForgotPassword } from "./components-page/forgot-password";
export { MessageCard } from "./components/message-cards/message-card";
export { UserButton } from "./components/user-button";
export { AccountSettings } from "./components-page/account-settings";
export { AuthPage } from "./components-page/auth-page";
export { CredentialSignInForm as CredentialSignIn } from "./components/credential-sign-in-form";
export { CredentialSignUpForm as CredentialSignUp } from "./components/credential-sign-up-form";
export { MagicLinkSignInForm as MagicLinkSignIn } from "./components/magic-link-sign-in-form";
export { OAuthButton } from "./components/oauth-button";
export { OAuthButtonGroup } from "./components/oauth-button-group";

export {
  SelectedTeamSwitcher,
  /**
   * @deprecated This was renamed to `SelectedTeamSwitcher`.
   */
  SelectedTeamSwitcher as TeamSwitcher,
} from "./components/selected-team-switcher";
