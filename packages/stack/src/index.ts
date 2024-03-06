export { default as StackProvider } from "./providers/StackProvider";

export { useUser, useStackApp } from "./lib/hooks";
export { StackClientApp, StackServerApp, StackAdminApp } from "./lib/stack-app";

export { default as SignIn } from "./components/SignIn";
export { default as SignUp } from "./components/SignUp";
export { default as StackHandler } from "./components/StackHandler";
export { default as EmailVerification } from "./components/EmailVerification";
export { default as PasswordReset } from "./components/PasswordReset";
export { default as ForgotPassword } from "./components/ForgotPassword";

// TODO we can't import it like this
import '../dist/tailwind.css';
