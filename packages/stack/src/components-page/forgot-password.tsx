'use client';

import ForgotPasswordElement from "../components/forgot-password";
import MaybeFullPage from "../components/maybe-full-page";
import { useUser, useStackApp } from "..";
import PredefinedMessageCard from "../components/message-cards/predefined-message-card";
import { useState } from "react";
import { Text } from "../components-core";
import { Link } from "../components/ui/link";


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
        <Text size="xl" as='h2'>Reset Your Password</Text>
        <Text>
          {"Don't need to reset? "}
          <Link href={stackApp.urls['signUp']} className='underline'>
            Sign in
          </Link>
        </Text>
      </div>
      <ForgotPasswordElement onSent={() => setSent(true)} />
    </MaybeFullPage>
  );
};
