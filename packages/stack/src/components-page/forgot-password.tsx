'use client';

import ForgotPasswordElement from "../components/forgot-password";
import MaybeFullPage from "../components/maybe-full-page";
import { useUser, useStackApp } from "..";
import PredefinedMessageCard from "../components/message-cards/predefined-message-card";
import { useState } from "react";
import { Link, Text } from "../components-core";


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
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <Text size="xl" as='h2'>Reset Your Password</Text>
        <Text>
          {"Don't need to reset? "}
          <Link href={stackApp.urls['signUp']}>
            Sign In
          </Link>
        </Text>
      </div>
      <ForgotPasswordElement onSent={() => setSent(true)} />
    </MaybeFullPage>
  );
};
