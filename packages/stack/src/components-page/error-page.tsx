'use client';

import { useStackApp } from "..";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";
import { KnownError, KnownErrors } from "@stackframe/stack-shared";
import { KnownErrorMessageCard } from "../components/message-cards/known-error-message-card";
import { Typography } from "@stackframe/stack-ui";
import { MessageCard } from "../components/message-cards/message-card";


export function ErrorPage({ fullPage=false, searchParams }: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const stackApp = useStackApp();
  const errorCode = searchParams.errorCode;
  const message = searchParams.message;
  const details = searchParams.details;

  const unknownErrorCard = <PredefinedMessageCard type='unknownError' fullPage={fullPage} />;

  if (!errorCode || !message || !details) {
    return unknownErrorCard;
  }

  let error;
  try {
    error = KnownError.fromJson({ code: errorCode, message, details });
  } catch {
    return unknownErrorCard;
  }

  if (error instanceof KnownErrors.OAuthConnectionAlreadyConnectedToAnotherUser) {
    // TODO: add "Connect a different account" button
    return (
      <MessageCard
        title="Failed to connect account"
        fullPage={fullPage}
        primaryButtonText="Go to Home"
        primaryAction={() => stackApp.redirectToHome()}
      >
        <Typography>
          This account is already connected to another user. Please connect a different account.
        </Typography>
      </MessageCard>
    );
  }

  if (error instanceof KnownErrors.UserAlreadyConnectedToAnotherOAuthConnection) {
    // TODO: add "Connect again" button
    return (
      <MessageCard
        title="Failed to connect account"
        fullPage={fullPage}
        primaryButtonText="Go to Home"
        primaryAction={() => stackApp.redirectToHome()}
      >
        <Typography>
          The user is already connected to another OAuth account. Did you maybe selected the wrong account on the OAuth provider page?
        </Typography>
      </MessageCard>
    );
  }

  return <KnownErrorMessageCard error={error} fullPage={fullPage} />;
}
