'use client';

import ForgotPasswordElement from "../components/forgot-password";
import CardFrame from "../components/card-frame";
import { useUser, useStackApp } from "..";
import RedirectMessageCard from "../components/redirect-message-card";
import { useState } from "react";
import { Link, Text } from "../components-core";


export default function ForgotPassword({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const [sent, setSent] = useState(false);

  if (user) {
    return <RedirectMessageCard type='signedIn' fullPage={fullPage} />;
  }

  if (sent) {
    return <RedirectMessageCard type='emailSent' fullPage={fullPage} />;
  }

  return (
    <CardFrame fullPage={fullPage}>
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
    </CardFrame>
  );
};
