'use client';

import { MessageCard } from "../components/message-cards/message-card";
import { StackClientApp, useStackApp } from "..";
import React from "react";
import PasswordResetForm from "../components/password-reset-form";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { KnownErrors } from "@stackframe/stack-shared";
import { Typography } from "@stackframe/stack-ui";

const cachedVerifyPasswordResetCode = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyPasswordResetCode(code);
});

export function PasswordReset({
  searchParams,
  fullPage = false,
}: {
  searchParams?: Record<string, string>,
  fullPage?: boolean,
}) {
  const stackApp = useStackApp();

  const invalidJsx = (
    <MessageCard title="Invalid Password Reset Link" fullPage={fullPage}>
      <Typography>Please double check if you have the correct password reset link.</Typography>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Password Reset Link" fullPage={fullPage}>
      <Typography>Your password reset link has expired. Please request a new password reset link from the login page.</Typography>
    </MessageCard>
  );

  const usedJsx = (
    <MessageCard title="Used Password Reset Link" fullPage={fullPage}>
      <Typography>This password reset link has already been used. If you need to reset your password again, please request a new password reset link from the login page.</Typography>
    </MessageCard>
  );

  const code = searchParams?.code;
  if (!code) {
    return invalidJsx;
  }

  const error = React.use(cachedVerifyPasswordResetCode(stackApp, code));

  if (error instanceof KnownErrors.VerificationCodeNotFound) {
    return invalidJsx;
  } else if (error instanceof KnownErrors.VerificationCodeExpired) {
    return expiredJsx;
  } else if (error instanceof KnownErrors.VerificationCodeAlreadyUsed) {
    return usedJsx;
  } else if (error) {
    throw error;
  }

  return <PasswordResetForm code={code} fullPage={fullPage} />;
}
