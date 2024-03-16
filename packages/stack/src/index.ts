export { default as StackProvider } from "./providers/stack-provider";

export { useUser, useStackApp } from "./lib/hooks";
export { StackClientApp, StackServerApp, StackAdminApp } from "./lib/stack-app";

export { default as SignIn } from "./components/sign-in";
export { default as SignUp } from "./components/sign-up";
export { default as StackHandler } from "./components/stack-handler";
export { default as EmailVerification } from "./components/email-verification";
export { default as PasswordReset } from "./components/password-reset";
export { default as ForgotPassword } from "./components/forgot-password";

// TODO we can't import it like this
import '../dist/tailwind.css';
