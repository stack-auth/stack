'use client';

import ForgotPasswordElement from "../elements/ForgotPassword";
import CardFrame from "../elements/CardFrame";
import CardHeader from "../elements/CardHeader";
import { useUser, useStackApp } from "..";
import RedirectMessageCard from "../elements/RedirectMessageCard";
import NextLink from 'next/link';
import { useState } from "react";


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
        <p>
          {"Don't need to reset? "}
          <NextLink href={stackApp.urls['signUp']} passHref className="wl_text-blue-500">
            Sign In
          </NextLink>
        </p>
      </CardHeader>
      <ForgotPasswordElement onSent={() => setSent(true)} />
    </CardFrame>
  );
};
