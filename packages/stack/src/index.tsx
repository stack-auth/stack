export { default as StackProvider } from "./providers/stack-provider";
export { useUser, useStackApp } from "./lib/hooks";
export { StackClientApp, StackServerApp, StackAdminApp } from "./lib/stack-app";
export { default as StackHandler } from "./components-page/stack-handler";
export { useDesign } from './providers/design-provider';
export type { ColorPalette } from './providers/design-provider';
export { StackTheme } from './providers/theme-provider';
export type { ThemeConfig } from './providers/theme-provider';
export type {
  CurrentUser, 
  Project, 
  ServerUser as ServerUser, 
  ApiKeySetFirstView, 
  ApiKeySet, 
  ServerTeam, 
  Team, 
  TeamMember,
  ServerTeamMember,
  ServerPermission as Permission,
  ServerPermission,
} from './lib/stack-app';

export { SignIn } from "./components-page/sign-in";
export { SignUp } from "./components-page/sign-up";
export { EmailVerification } from "./components-page/email-verification";
export { PasswordReset } from "./components-page/password-reset";
export { ForgotPassword } from "./components-page/forgot-password";
export { MessageCard } from "./components/message-cards/message-card";
export { OAuthButtonGroup } from "./components/oauth-button-group";
export { UserButton } from "./components/user-button";
export { AccountSettings } from "./components-page/account-settings";
export { 
  SelectedTeamSwitcher,
  /**
   * @deprecated This was renamed to `SelectedTeamSwitcher`.
   */
  SelectedTeamSwitcher as TeamSwitcher,
} from "./components/selected-team-switcher";
export { 
  CredentialSignInForm,
  /**
   * @deprecated This was renamed to `CredentialSignInForm`.
   */
  CredentialSignInForm as CredentialSignIn,
} from "./components/credential-sign-in-form";
export { 
  CredentialSignUpForm,
  /**
   * @deprecated This was renamed to `CredentialSignUpForm`.
   */
} from "./components/credential-sign-up-form";
export { 
  MagicLinkSignInForm,
  /**
   * @deprecated This was renamed to `MagicLinkSignInForm`.
   */
  MagicLinkSignInForm as MagicLinkSignIn,
} from "./components/magic-link-sign-in-form";
export { 
  OAuthButton,
  /**
   * @deprecated This was renamed to `OAuthButton`.
   */
  OAuthButton as OAuthSignInButton,
} from "./components/oauth-button";
