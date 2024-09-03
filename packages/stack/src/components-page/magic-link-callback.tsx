"use client";

import React from "react";
import { KnownErrors } from "@stackframe/stack-shared";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { neverResolve } from "@stackframe/stack-shared/dist/utils/promises";
import { StackClientApp, useStackApp, useUser } from "..";
import { MessageCard } from "../components/message-cards/message-card";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";

const cacheSignInWithMagicLink = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.signInWithMagicLink(code);
});

export function MagicLinkCallback({
  searchParams: { code = "" } = {},
  fullPage = false,
}: {
  searchParams?: Record<string, string>;
  fullPage?: boolean;
}) {
  const stackApp = useStackApp();
  const user = useUser();

  if (user) {
    return <PredefinedMessageCard type="signedIn" fullPage={fullPage} />;
  }

  const invalidJsx = (
    <MessageCard title="Invalid Magic Link" fullPage={fullPage}>
      <p>Please check if you have the correct link. If you continue to have issues, please contact support.</p>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Magic Link" fullPage={fullPage}>
      <p>Your magic link has expired. Please request a new magic link if you need to sign-in.</p>
    </MessageCard>
  );

  const alreadyUsedJsx = (
    <MessageCard title="Magic Link Already Used" fullPage={fullPage}>
      <p>
        The magic link has already been used. The link can only be used once. Please request a new magic link if you need to sign-in again.
      </p>
    </MessageCard>
  );

  if (!code) {
    return invalidJsx;
  }

  const error = React.use(cacheSignInWithMagicLink(stackApp, code));

  if (error instanceof KnownErrors.VerificationCodeNotFound) {
    return invalidJsx;
  } else if (error instanceof KnownErrors.VerificationCodeExpired) {
    return expiredJsx;
  } else if (error instanceof KnownErrors.VerificationCodeAlreadyUsed) {
    return alreadyUsedJsx;
  } else if (error) {
    throw error;
  }

  React.use(neverResolve());
}
