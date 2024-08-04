'use client';

import { KnownErrors } from "@stackframe/stack-shared";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Typography } from "@stackframe/stack-ui";
import React from "react";
import { MessageCard, StackClientApp, useStackApp, useUser } from "..";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";

const cachedVerifyInvitation = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyTeamInvitationCode(code);
});

const cachedGetInvitationDetails = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.getTeamInvitationDetails(code);
});

function TeamInvitationInner(props: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const stackApp = useStackApp();
  const [success, setSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const details = React.use(cachedGetInvitationDetails(stackApp, props.searchParams.code || ''));

  if (errorMessage || details.status === 'error') {
    return (
      <PredefinedMessageCard type="unknownError" fullPage={props.fullPage} />
    );
  }

  if (success) {
    return (
      <MessageCard
        title="Team invitation"
        fullPage={props.fullPage}
        primaryButtonText="Go to home"
        primaryAction={() => stackApp.redirectToHome()}
      >
        <Typography>You have successfully joined {details.data.teamDisplayName}</Typography>
      </MessageCard>
    );
  }


  return (
    <MessageCard
      title="Team invitation"
      fullPage={props.fullPage}
      primaryButtonText="Join"
      primaryAction={() => runAsynchronouslyWithAlert(async () => {
        const result = await stackApp.acceptTeamInvitation(props.searchParams.code || '');
        if (result.status === 'error') {
        setErrorMessage(result.error.message);
        } else {
        setSuccess(true);
        }
      })}
      secondaryButtonText="Ignore"
      secondaryAction={() => stackApp.redirectToHome()}
    >
      <Typography>You are invited to join {details.data.teamDisplayName}</Typography>
    </MessageCard>
  );
}

export function TeamInvitation({ fullPage=false, searchParams }: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const user = useUser();
  const stackApp = useStackApp();

  const invalidJsx = (
    <MessageCard title="Invalid Team Invitation Link" fullPage={fullPage}>
      <Typography>Please double check if you have the correct team invitation link.</Typography>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Team Invitation Link" fullPage={fullPage}>
      <Typography>Your team invitation link has expired. Please request a new team invitation link </Typography>
    </MessageCard>
  );

  const usedJsx = (
    <MessageCard title="Used Team Invitation Link" fullPage={fullPage}>
      <Typography>This team invitation link has already been used.</Typography>
    </MessageCard>
  );

  const code = searchParams.code;
  if (!code) {
    return invalidJsx;
  }

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
    const error = verificationResult.error;
    if (error instanceof KnownErrors.VerificationCodeNotFound) {
      return invalidJsx;
    } else if (error instanceof KnownErrors.VerificationCodeExpired) {
      return expiredJsx;
    } else if (error instanceof KnownErrors.VerificationCodeAlreadyUsed) {
      return usedJsx;
    } else {
      throw error;
    }
  }

  return <TeamInvitationInner fullPage={fullPage} searchParams={searchParams} />;
};
