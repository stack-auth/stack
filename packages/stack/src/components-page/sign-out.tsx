'use client';

import { use } from "react";
import { useUser } from "..";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";

export function SignOut(props: { fullPage?: boolean }) {
  const user = useUser();

  if (user) {
    use(user.signOut());
  }

  return <PredefinedMessageCard type='signedOut' fullPage={props.fullPage} />;
}
