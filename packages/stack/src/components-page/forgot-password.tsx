'use client';

import ForgotPasswordElement from "../components/forgot-password";
import MaybeFullPage from "../components/maybe-full-page";
import { useUser, useStackApp } from "..";
import PredefinedMessageCard from "../components/message-cards/predefined-message-card";
import { useState } from "react";
import { StyledLink } from "../components/ui/link";
import Typography from "../components/ui/typography";


export default function ForgotPassword({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const [sent, setSent] = useState(false);

  if (user) {
    return <PredefinedMessageCard type='signedIn' fullPage={fullPage} />;
  }

  if (sent) {
    return <PredefinedMessageCard type='emailSent' fullPage={fullPage} />;
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
      <ForgotPasswordElement onSent={() => setSent(true)} />
    </MaybeFullPage>
  );
};
