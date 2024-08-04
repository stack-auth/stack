'use client';

import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { Button, Typography } from "@stackframe/stack-ui";
import React from "react";
import { MessageCard, StackClientApp, useStackApp, useUser } from "..";
import { MaybeFullPage } from "../components/elements/maybe-full-page";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";

const cachedVerifyInvitation = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyTeamInvitationCode(code);
});

export function TeamInvitation({ fullPage=false, searchParams }: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const stackApp = useStackApp();
  const user = useUser();

  if (!user) {
    return (
      <MessageCard
        title="Team invitation"
        fullPage={fullPage}
        primaryButtonText="Go to sign in"
        primaryAction={() => stackApp.redirectToSignIn()}
        secondaryButtonText="Cancel"
        secondaryAction={() => stackApp.redirectToHome()}
      >
        <Typography>Sign in or create an account to join the team.</Typography>
      </MessageCard>
    );
  }

  const verificationResult = React.use(cachedVerifyInvitation(stackApp, searchParams.code || ''));

  if (verificationResult.status === 'error') {
    return (
      <MessageCard
        title="Invalid Invitation"
        fullPage={fullPage}
        primaryButtonText="Go to home"
        primaryAction={() => stackApp.redirectToHome()}
      />
    );
  }

  return (
    <MessageCard
      title="Team invitation"
      fullPage={fullPage}
      primaryButtonText="Join"
      primaryAction={() => runAsynchronouslyWithAlert(stackApp.acceptTeamInvitation(searchParams.code || ''))}
      secondaryButtonText="Ignore"
      secondaryAction={() => stackApp.redirectToHome()}
    >
      <Typography>You are invited to join {verificationResult.data.teamDisplayName}</Typography>
    </MessageCard>
  );
};
