"use client";

import { useStackApp } from "../..";
import Typography from "../ui/typography";
import MessageCard from "./message-card";

export default function PredefinedMessageCard({ 
  type,
  fullPage=false,
}: { 
  type: 'signedIn' | 'signedOut' | 'emailSent' | 'passwordReset' | 'emailVerified' | 'unknownError',
  fullPage?: boolean, 
}) {
  const stackApp = useStackApp();

  let title: string;
  let message: string | null = null;
  let primaryButton: string | null = null;
  let secondaryButton: string | null = null;
  let primaryAction: (() => Promise<void> | void) | null = null;
  let secondaryAction: (() => Promise<void> | void) | null = null;

  switch (type) {
    case 'signedIn': {
      title = "You are already signed in";
      primaryAction = () => stackApp.redirectToAfterSignOut();
      secondaryAction = () => stackApp.redirectToSignOut();
      primaryButton = "Go to Home";
      secondaryButton = "Sign Out";
      break;
    }
    case 'signedOut': {
      title = "You are not currently signed in.";
      primaryAction = () => stackApp.redirectToSignIn();
      primaryButton = "Go to Home";
      break;
    }
    case 'emailSent': {
      title = "Email sent!";
      message = 'Please check your inbox. Make sure to check your spam folder.';
      primaryAction = () => stackApp.redirectToHome();
      primaryButton = "Go to Home";
      break;
    }
    case 'passwordReset': {
      title = "Password reset successfully!";
      message = 'Your password has been reset. You can now sign in with your new password.';
      primaryAction = () => stackApp.redirectToSignIn();
      primaryButton = "Go to Sign In";
      break;
    }
    case 'emailVerified': {
      title = "Email verified!";
      message = 'Your have successfully verified your email.';
      primaryAction = () => stackApp.redirectToSignIn();
      primaryButton = "Go to Home";
      break;
    }
    case 'unknownError': {
      title = "An unknown error occurred";
      message = 'Please try again and if the problem persists, contact support.';
      primaryAction = () => stackApp.redirectToHome();
      primaryButton = "Go to Home";
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
