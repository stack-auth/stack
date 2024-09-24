'use client';

import React from "react";
import { StackClientApp, useStackApp, useUser } from "..";
import { MessageCard } from "../components/message-cards/message-card";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";
import { KnownErrors } from "@stackframe/stack-shared";
import { neverResolve } from "@stackframe/stack-shared/dist/utils/promises";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { useTranslation } from "../lib/translations";

const cacheSignInWithMagicLink = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.signInWithMagicLink(code);
});

export function MagicLinkCallback(props: {
  searchParams?: Record<string, string>,
  fullPage?: boolean,
}) {
  const { t } = useTranslation();
  const stackApp = useStackApp();
  const user = useUser();

  if (user) {
    return <PredefinedMessageCard type='signedIn' fullPage={!!props.fullPage} />;
  }

  const invalidJsx = (
    <MessageCard title={t("Invalid Magic Link")} fullPage={!!props.fullPage}>
      <p>{t("Please check if you have the correct link. If you continue to have issues, please contact support.")}</p>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title={t("Expired Magic Link")} fullPage={!!props.fullPage}>
      <p>{t("Your magic link has expired. Please request a new magic link if you need to sign-in.")}</p>
    </MessageCard>
  );

  const alreadyUsedJsx = (
    <MessageCard title={t("Magic Link Already Used")} fullPage={!!props.fullPage}>
      <p>{t("The magic link has already been used. The link can only be used once. Please request a new magic link if you need to sign-in again.")}</p>
    </MessageCard>
  );

  if (!props.searchParams?.code) {
    return invalidJsx;
  }

  const result = React.use(cacheSignInWithMagicLink(stackApp, props.searchParams.code));
  if (result.status === 'error') {
    if (result.error instanceof KnownErrors.VerificationCodeNotFound) {
      return invalidJsx;
    } else if (result.error instanceof KnownErrors.VerificationCodeExpired) {
      return expiredJsx;
    } else if (result.error instanceof KnownErrors.VerificationCodeAlreadyUsed) {
      return alreadyUsedJsx;
    } else {
      throw result.error;
    }
  }

  React.use(neverResolve());
}
