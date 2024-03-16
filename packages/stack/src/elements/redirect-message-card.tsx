"use client";

import { useRouter } from "next/navigation";
import { useStackApp } from "..";
import MessageCard from "./message-card";
import { useElements } from "@stackframe/stack-ui";

export default function RedirectMessageCard({ 
  type,
  fullPage=false,
}: { 
  type: 'signedIn' | 'signedOut' | 'emailSent' | 'passwordReset' | 'emailVerified',
  fullPage?: boolean, 
}) {
  const stackApp = useStackApp();
  const router = useRouter();
  const { Text, Button } = useElements();

  let title: string;
  let primaryUrl: string;
  let secondaryUrl: string | null = null;
  let message: string | null = null;
  let primaryButton: string;
  let secondaryButton: string | null = null;
  switch (type) {
    case 'signedIn': {
      title = "You are already signed in";
      primaryUrl = stackApp.urls.home;
      secondaryUrl = stackApp.urls.signOut;
      primaryButton = "Go to Home";
      secondaryButton = "Sign Out";
      break;
    }
    case 'signedOut': {
      title = "You are not currently signed in.";
      primaryUrl = stackApp.urls.home;
      primaryButton = "Go to Home";
      break;
    }
    case 'emailSent': {
      title = "Email sent!";
      message = 'Please check your inbox. Make sure to check your spam folder.';
      primaryUrl = stackApp.urls.home;
      primaryButton = "Go to Home";
      break;
    }
    case 'passwordReset': {
      title = "Password reset successfully!";
      message = 'Your password has been reset. You can now sign in with your new password.';
      primaryUrl = stackApp.urls.signIn;
      primaryButton = "Go to Sign In";
      break;
    }
    case 'emailVerified': {
      title = "Email verified!";
      message = 'Your have successfully verified your email.';
      primaryUrl = stackApp.urls.home;
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
            onClick={() => router.push(stackApp.urls.signOut.toString())}
          >
            {secondaryButton}
          </Button>
        )}
        
        <Button onClick={() => router.push(primaryUrl.toString())}>
          {primaryButton}
        </Button>
      </div>
    </MessageCard>
  );
}
