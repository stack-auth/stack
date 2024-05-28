"use client";

import { useRouter } from "next/navigation";
import { useStackApp } from "..";
import MessageCard from "./message-card";
import { Text, Button } from "../components-core";
import { neverResolve, wait } from "@stackframe/stack-shared/dist/utils/promises";

export default function RedirectMessageCard({ 
  type,
  fullPage=false,
}: { 
  type: 'signedIn' | 'signedOut' | 'emailSent' | 'passwordReset' | 'emailVerified',
  fullPage?: boolean, 
}) {
  const stackApp = useStackApp();
  const router = useRouter();

  let title: string;
  let primaryAction: () => Promise<void>;
  let message: string | null = null;
  let primaryButton: string;
  let secondaryButton: string | null = null;
  switch (type) {
    case 'signedIn': {
      title = "You are already signed in";
      primaryAction = () => stackApp.redirectToAfterSignOut();
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
  }

  return (
    <MessageCard title={title} fullPage={fullPage}>
      {message && <Text>{message}</Text>}

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: 20 }}>
        {secondaryButton && (
          <Button
            variant="secondary"
            onClick={async () => {
              await stackApp.redirectToSignOut();
            }}
          >
            {secondaryButton}
          </Button>
        )}
        
        <Button onClick={primaryAction}>
          {primaryButton}
        </Button>
      </div>
    </MessageCard>
  );
}
