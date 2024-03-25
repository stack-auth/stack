'use client';

import { use } from "react";
import { useStackApp } from "..";
import MessageCard from "../components/message-card";
import RedirectMessageCard from "../components/redirect-message-card";
import { KnownErrors } from "@stackframe/stack-shared";

export default function EmailVerification({ 
  searchParams: {
    code = "",
  } = {},
  fullPage = false,
}: { 
  searchParams?: Record<string, string>,
  fullPage?: boolean,
}) {
  const stackApp = useStackApp();

  const invalidJsx = (
    <MessageCard title="Invalid Verification Link" fullPage={fullPage}>
      <p>Please check if you have the correct link. If you continue to have issues, please contact support.</p>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Verification Link" fullPage={fullPage}>
      <p>Your email verification link has expired. Please request a new verification link from your account settings.</p>
    </MessageCard>
  );

  if (!code) {
    return invalidJsx;
  }

  const error = use(stackApp.verifyEmail(code));

  if (error instanceof KnownErrors.EmailVerificationCodeNotFound) {
    return invalidJsx;
  } else if (error instanceof KnownErrors.EmailVerificationCodeExpired) {
    return expiredJsx;
  } else if (error instanceof KnownErrors.EmailVerificationCodeAlreadyUsed) {
    // everything fine, continue
  } else if (error) {
    throw error;
  }

  return <RedirectMessageCard type='emailVerified' fullPage={fullPage} />;
}
