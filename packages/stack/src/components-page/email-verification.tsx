'use client';

import React from "react";
import { StackClientApp, useStackApp } from "..";
import { MessageCard } from "../components/message-cards/message-card";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";
import { KnownErrors } from "@stackframe/stack-shared";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { useTranslation } from "../lib/translations";

const cacheVerifyEmail = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyEmail(code);
});

export function EmailVerification(props: {
  searchParams?: Record<string, string>,
  fullPage?: boolean,
}) {
  const { t } = useTranslation();
  const stackApp = useStackApp();

  const invalidJsx = (
    <MessageCard title={t("Invalid Verification Link")} fullPage={!!props.fullPage}>
      <p>{t("Please check if you have the correct link. If you continue to have issues, please contact support.")}</p>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title={t("Expired Verification Link")} fullPage={!!props.fullPage}>
      <p>{t("Your email verification link has expired. Please request a new verification link from your account settings.")}</p>
    </MessageCard>
  );

  if (!props.searchParams?.code) {
    return invalidJsx;
  }

  const result = React.use(cacheVerifyEmail(stackApp, props.searchParams.code));

  if (result.status === 'error') {
    if (result.error instanceof KnownErrors.VerificationCodeNotFound) {
      return invalidJsx;
    } else if (result.error instanceof KnownErrors.VerificationCodeExpired) {
      return expiredJsx;
    } else if (result.error instanceof KnownErrors.VerificationCodeAlreadyUsed) {
      // everything fine, continue
    } else {
      throw result.error;
    }
  }

  return <PredefinedMessageCard type='emailVerified' fullPage={!!props.fullPage} />;
}
