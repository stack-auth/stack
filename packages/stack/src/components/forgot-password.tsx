'use client';

import ForgotPasswordElement from "../elements/forgot-password";
import CardFrame from "../elements/card-frame";
import CardHeader from "../elements/card-header";
import { useUser, useStackApp } from "..";
import RedirectMessageCard from "../elements/redirect-message-card";
import { useState } from "react";
import { useElements } from "@stackframe/stack-ui";


export default function ForgotPassword({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const [sent, setSent] = useState(false);
  const { Link, Text } = useElements();

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
