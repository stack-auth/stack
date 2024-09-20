'use client';

import { useStackApp } from "..";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";
import { KnownError, KnownErrors } from "@stackframe/stack-shared";
import { KnownErrorMessageCard } from "../components/message-cards/known-error-message-card";
import { Typography } from "@stackframe/stack-ui";
import { MessageCard } from "../components/message-cards/message-card";
import { useTranslation } from "../lib/translations";


export function ErrorPage(props: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const { t } = useTranslation();
  const stackApp = useStackApp();
  const errorCode = props.searchParams.errorCode;
  const message = props.searchParams.message;
  const details = props.searchParams.details;

  const unknownErrorCard = <PredefinedMessageCard type='unknownError' fullPage={!!props.fullPage} />;

  console.log(errorCode, message, details);

  if (!errorCode || !message) {
    return unknownErrorCard;
  }

  let error;
  try {
    const detailJson = details ? JSON.parse(details) : {};
    error = KnownError.fromJson({ code: errorCode, message, details: detailJson });
  } catch (e) {
    return unknownErrorCard;
  }

  if (error instanceof KnownErrors.OAuthConnectionAlreadyConnectedToAnotherUser) {
    // TODO: add "Connect a different account" button
    return (
      <MessageCard
        title={t("Failed to connect account")}
        fullPage={!!props.fullPage}
        primaryButtonText={t("Go to Home")}
        primaryAction={() => stackApp.redirectToHome()}
      >
        <Typography>
          {t("This account is already connected to another user. Please connect a different account.")}
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
          {t("The user is already connected to another OAuth account. Did you maybe selected the wrong account on the OAuth provider page?")}
        </Typography>
      </MessageCard>
    );
  }

  if (error instanceof KnownErrors.OAuthProviderAccessDenied) {
    return (
      <MessageCard
        title="OAuth provider access denied"
        fullPage={!!props.fullPage}
        primaryButtonText="Sign in again"
        primaryAction={() => stackApp.redirectToSignIn()}
        secondaryButtonText="Go to Home"
        secondaryAction={() => stackApp.redirectToHome()}
      >
        <Typography>
          {t("Did you maybe pressed cancel on the OAuth provider's page?")}
        </Typography>
      </MessageCard>
    );
  }

  return <KnownErrorMessageCard error={error} fullPage={!!props.fullPage} />;
}
