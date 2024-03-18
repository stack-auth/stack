'use client';

import MessageCard from "../elements/message-card";
import { StackClientApp, useStackApp } from "..";
import { use } from "react";
import PasswordResetInner from "../elements/password-reset-inner";
import { PasswordResetLinkExpiredErrorCode, PasswordResetLinkInvalidErrorCode, PasswordResetLinkUsedErrorCode } from "@stackframe/stack-shared/dist/utils/types";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { Text } from "@stackframe/stack-ui";

const cachedVerifyPasswordResetCode = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyPasswordResetCode(code);
});

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
      <Text>Please double check if you have the correct password reset link.</Text>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Password Reset Link" fullPage={fullPage}>
      <Text>Your password reset link has expired. Please request a new password reset link from the login page.</Text>
    </MessageCard>
  );

  const usedJsx = (
    <MessageCard title="Used Password Reset Link" fullPage={fullPage}>
      <Text>This password reset link has already been used. If you need to reset your password again, please request a new password reset link from the login page.</Text>
    </MessageCard>
  );

  const code = searchParams?.code;
  if (!code) {
    return invalidJsx;
  }

  const errorCode = use(cachedVerifyPasswordResetCode(stackApp, code));

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
