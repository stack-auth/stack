'use client';

import MessageCard from "../elements/MessageCard";
import { useStackApp } from "..";
import { use } from "react";
import PasswordResetInner from "../elements/PasswordResetInner";
import { PasswordResetLinkExpiredErrorCode, PasswordResetLinkInvalidErrorCode, PasswordResetLinkUsedErrorCode } from "stack-shared/dist/utils/types";
import { useStrictMemo } from "stack-shared/dist/hooks/use-strict-memo";

export default function PasswordReset({
  searchParams,
  fullPage = false,
}: { 
  searchParams?: Record<string, string>,
  fullPage?: boolean, 
}) {
  const stackApp = useStackApp();

  const invalidJsx = (
    <MessageCard title="Invalid Password Reset Link" fullPage={fullPage}>
      <p>Please check if you have the correct password reset link. If you continue to have issues, please contact support.</p>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Password Reset Link" fullPage={fullPage}>
      <p>Your password reset link has expired. Please request a new password reset link from the login page.</p>
    </MessageCard>
  );

  const usedJsx = (
    <MessageCard title="Used Password Reset Link" fullPage={fullPage}>
      <p>This password reset link has already been used. If you need to reset your password again, please request a new password reset link from the login page.</p>
    </MessageCard>
  );

  const code = searchParams?.code;
  if (!code) {
    return invalidJsx;
  }

  const errorCdoePromise = useStrictMemo(() => {
    return stackApp.verifyPasswordResetCode(code);
  }, [code]);
  const errorCode = use(errorCdoePromise);

  switch (errorCode) {
    case PasswordResetLinkInvalidErrorCode: {
      return invalidJsx;
    }
    case PasswordResetLinkExpiredErrorCode: {
      return expiredJsx;
    }
    case PasswordResetLinkUsedErrorCode: {
      return usedJsx;
    }
    case undefined: {
      return <PasswordResetInner code={code} fullPage={fullPage} />;
    }
  }
}
