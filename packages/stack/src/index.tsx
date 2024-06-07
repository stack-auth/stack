export { default as StackProvider } from "./providers/stack-provider";

export { useUser, useStackApp } from "./lib/hooks";
export { StackClientApp, StackServerApp, StackAdminApp } from "./lib/stack-app";

export { default as StackHandler } from "./components-page/stack-handler";
export { default as SignIn } from "./components-page/sign-in";
export { default as SignUp } from "./components-page/sign-up";
export { default as EmailVerification } from "./components-page/email-verification";
export { default as PasswordReset } from "./components-page/password-reset";
export { default as ForgotPassword } from "./components-page/forgot-password";
export { default as MessageCard } from "./components/message-cards/message-card";

export { default as CredentialSignIn } from "./components/credential-sign-in";
export { default as CredentialSignUp } from "./components/credential-sign-up";
export { default as OAuthButton } from "./components/oauth-button";
export { default as OAuthGroup } from "./components/oauth-group";
export { default as PasswordField } from "./components/password-field";
export { default as UserButton } from "./components/user-button";
export { default as AccountSettings } from "./components-page/account-settings";
export { default as AuthPage } from "./components-page/auth-page";

export { useDesign } from './providers/design-provider';
export type { ColorPalette } from './providers/design-provider';
export { useComponents } from './providers/component-provider';
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

export * from './components-core';
