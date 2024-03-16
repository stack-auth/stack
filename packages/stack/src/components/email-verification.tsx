'use client';

import { use } from "react";
import { useStackApp } from "..";
import MessageCard from "../elements/message-card";
import RedirectMessageCard from "../elements/redirect-message-card";
import { EmailVerificationLinkExpiredErrorCode, EmailVerificationLinkInvalidErrorCode, EmailVerificationLinkUsedErrorCode } from "@stackframe/stack-shared/dist/utils/types";

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

  const errorCode = use(stackApp.verifyEmail(code));

  switch (errorCode) {
    case EmailVerificationLinkInvalidErrorCode: {
      return invalidJsx;
    }
    case EmailVerificationLinkExpiredErrorCode: {
      return expiredJsx;
    }
    case EmailVerificationLinkUsedErrorCode: 
    case undefined: {
      return <RedirectMessageCard type='emailVerified' fullPage={fullPage} />;
    }
  }
  return null;
}
