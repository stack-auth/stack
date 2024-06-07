'use client';

import { MessageCard } from "..";
import PredefinedMessageCard from "../components/message-cards/predefined-message-card";
import { Text } from "../components-core";
import { KnownError, KnownErrors } from "@stackframe/stack-shared";
import KnownErrorMessageCard from "../components/message-cards/known-error-message-card";


export default function ErrorPage({ fullPage=false, searchParams }: { fullPage?: boolean, searchParams: Record<string, string> }) {
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
  } catch (e) {
    return unknownErrorCard;
  }

  if (error instanceof KnownErrors.OAuthAccountAlreadyConnectedToAnotherUser) {
    return (
      <MessageCard 
        title="Failed to connect account" 
        fullPage={fullPage}
        primaryButtonText="Connect another account"
        primaryAction={() => {}}
        secondaryButtonText="Cancel"
        secondaryAction={() => {}}
      >
        <Text>
          This account is already connected to another user. Please connect a different account.
        </Text>
      </MessageCard>
    );
  }

  return <KnownErrorMessageCard error={error} fullPage={fullPage} />;
}
