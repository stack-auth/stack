'use client';

import React from "react";
import { StackClientApp, useStackApp } from "..";
import { MessageCard } from "../components/message-cards/message-card";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";
import { KnownErrors } from "@stackframe/stack-shared";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";

const cacheVerifyEmail = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyEmail(code);
});

export function EmailVerification(props: {
  searchParams?: Record<string, string>,
  fullPage?: boolean,
}) {
  const stackApp = useStackApp();

  const invalidJsx = (
    <MessageCard title="Invalid Verification Link" fullPage={!!props.fullPage}>
      <p>Please check if you have the correct link. If you continue to have issues, please contact support.</p>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Verification Link" fullPage={!!props.fullPage}>
      <p>Your email verification link has expired. Please request a new verification link from your account settings.</p>
    </MessageCard>
  );

  if (!props.searchParams?.code) {
    return invalidJsx;
  }

  const error = React.use(cacheVerifyEmail(stackApp, props.searchParams.code));

  if (error instanceof KnownErrors.VerificationCodeNotFound) {
    return invalidJsx;
  } else if (error instanceof KnownErrors.VerificationCodeExpired) {
    return expiredJsx;
  } else if (error instanceof KnownErrors.VerificationCodeAlreadyUsed) {
    // everything fine, continue
  } else if (error) {
    throw error;
  }

  return <PredefinedMessageCard type='emailVerified' fullPage={!!props.fullPage} />;
}
