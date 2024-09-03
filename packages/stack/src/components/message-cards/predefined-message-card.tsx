"use client";

import { Typography } from "@stackframe/stack-ui";
import { useStackApp } from "../..";
import { MessageCard } from "./message-card";

export function PredefinedMessageCard({
  type,
  fullPage = false,
}: {
  type: "signedIn" | "signedOut" | "emailSent" | "passwordReset" | "emailVerified" | "unknownError" | "signUpDisabled";
  fullPage?: boolean;
}) {
  const stackApp = useStackApp();

  let title: string;
  let message: string | null = null;
  let primaryButton: string | null = null;
  let secondaryButton: string | null = null;
  let primaryAction: (() => Promise<void> | void) | null = null;
  let secondaryAction: (() => Promise<void> | void) | null = null;

  switch (type) {
    case "signedIn": {
      title = "You are already signed in";
      primaryAction = () => stackApp.redirectToHome();
      secondaryAction = () => stackApp.redirectToSignOut();
      primaryButton = "Go to home";
      secondaryButton = "Sign out";
      break;
    }
    case "signedOut": {
      title = "You are not currently signed in.";
      primaryAction = () => stackApp.redirectToSignIn();
      primaryButton = "Sign in";
      break;
    }
    case "signUpDisabled": {
      title = "Sign up for new users is not enabled at the moment.";
      primaryAction = () => stackApp.redirectToHome();
      secondaryAction = () => stackApp.redirectToSignIn();
      primaryButton = "Go to home";
      secondaryButton = "Sign in";
      break;
    }
    case "emailSent": {
      title = "Email sent!";
      message = "If the user with this e-mail address exists, an e-mail was sent to your inbox. Make sure to check your spam folder.";
      primaryAction = () => stackApp.redirectToHome();
      primaryButton = "Go to home";
      break;
    }
    case "passwordReset": {
      title = "Password reset successfully!";
      message = "Your password has been reset. You can now sign in with your new password.";
      primaryAction = () => stackApp.redirectToSignIn({ noRedirectBack: true });
      primaryButton = "Sign in";
      break;
    }
    case "emailVerified": {
      title = "Email verified!";
      message = "Your have successfully verified your email.";
      primaryAction = () => stackApp.redirectToSignIn({ noRedirectBack: true });
      primaryButton = "Sign in";
      break;
    }
    case "unknownError": {
      title = "An unknown error occurred";
      message = "Please try again and if the problem persists, contact support.";
      primaryAction = () => stackApp.redirectToHome();
      primaryButton = "Go to home";
      break;
    }
  }

  return (
    <MessageCard
      title={title}
      fullPage={fullPage}
      primaryButtonText={primaryButton}
      primaryAction={primaryAction}
      secondaryButtonText={secondaryButton || undefined}
      secondaryAction={secondaryAction || undefined}
    >
      {message && <Typography>{message}</Typography>}
    </MessageCard>
  );
}
