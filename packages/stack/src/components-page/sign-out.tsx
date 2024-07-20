'use client';

import React from "react";
import { useUser } from "..";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";

export function SignOut(props: { fullPage?: boolean }) {
  const user = useUser();

  if (user) {
    React.use(user.signOut());
  }

  return <PredefinedMessageCard type='signedOut' fullPage={props.fullPage} />;
}
