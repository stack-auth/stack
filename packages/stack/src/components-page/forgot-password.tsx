'use client';

import ForgotPasswordElement from "../components/forgot-password";
import CardFrame from "../components/card-frame";
import CardHeader from "../components/card-header";
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
      <CardHeader title="Reset Your Password">
        <Text>
          {"Don't need to reset? "}
          <Link href={stackApp.urls['signUp']}>
            Sign In
          </Link>
        </Text>
      </CardHeader>
      <ForgotPasswordElement onSent={() => setSent(true)} />
    </CardFrame>
  );
};
