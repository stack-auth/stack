'use client';

import { useStackApp } from "..";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";
import { KnownError, KnownErrors } from "@stackframe/stack-shared";
import { KnownErrorMessageCard } from "../components/message-cards/known-error-message-card";
import { Typography } from "@stackframe/stack-ui";
import { MessageCard } from "../components/message-cards/message-card";


export function ErrorPage(props: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const stackApp = useStackApp();
  const errorCode = props.searchParams.errorCode;
  const message = props.searchParams.message;
  const details = props.searchParams.details;

  const unknownErrorCard = <PredefinedMessageCard type='unknownError' fullPage={!!props.fullPage} />;

  if (!errorCode || !message || !details) {
    return unknownErrorCard;
  }

  let error;
  try {
    error = KnownError.fromJson({ code: errorCode, message, details });
  } catch (e) {
    return unknownErrorCard;
  }

  if (error instanceof KnownErrors.OAuthConnectionAlreadyConnectedToAnotherUser) {
    // TODO: add "Connect a different account" button
    return (
      <MessageCard
        title="Failed to connect account"
        fullPage={!!props.fullPage}
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
        fullPage={!!props.fullPage}
        primaryButtonText="Go to Home"
        primaryAction={() => stackApp.redirectToHome()}
      >
        <Typography>
          The user is already connected to another OAuth account. Did you maybe selected the wrong account on the OAuth provider page?
        </Typography>
      </MessageCard>
    );
  }

  return <KnownErrorMessageCard error={error} fullPage={!!props.fullPage} />;
}
