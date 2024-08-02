'use client';

import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { Typography } from "@stackframe/stack-ui";
import React from "react";
import { StackClientApp, useStackApp, useUser } from "..";
import { MaybeFullPage } from "../components/elements/maybe-full-page";

const cachedVerifyInvitation = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyTeamInvitation(code);
});

export function TeamInvitation({ fullPage=false, searchParams }: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const stackApp = useStackApp();
  const user = useUser();

  if (!user) {
    return (
      <MaybeFullPage fullPage={fullPage}>
        <div className="text-center mb-6 stack-scope">
          <Typography type='h2'>Join </Typography>
        </div>
      </MaybeFullPage>
    );
  }

  const verificationResult = React.use(cachedVerifyInvitation(stackApp, searchParams.code || ''));

  if (verificationResult.status === 'error') {
    return (
      <MaybeFullPage fullPage={fullPage}>
        <div className="text-center mb-6 stack-scope">
          <Typography type='h2'>Invalid Invitation</Typography>
        </div>
      </MaybeFullPage>
    );
  }

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className="text-center mb-6 stack-scope">
        <Typography type='h2'>{verificationResult.data.teamDisplayName}</Typography>
      </div>
    </MaybeFullPage>
  );
};
