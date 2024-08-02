'use client';

import { StyledLink, Typography } from "@stackframe/stack-ui";
import { useState } from "react";
import { useStackApp, useUser } from "..";
import { MaybeFullPage } from "../components/elements/maybe-full-page";

export function TeamInvitation({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const [sent, setSent] = useState(false);

  if (!user) {
    return (
      <MaybeFullPage fullPage={fullPage}>
        <div className="text-center mb-6 stack-scope">
          <Typography type='h2'>Join </Typography>
        </div>
      </MaybeFullPage>
    );
  }

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className="text-center mb-6 stack-scope">
        <Typography type='h2'>Reset Your Password</Typography>
        <Typography>
          {"Don't need to reset? "}
          <StyledLink href={stackApp.urls['signUp']}>
            Sign in
          </StyledLink>
        </Typography>
      </div>
    </MaybeFullPage>
  );
};
