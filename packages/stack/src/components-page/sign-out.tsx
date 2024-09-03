"use client";

import React from "react";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { CurrentUser, useUser } from "..";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";

const cacheSignOut = cacheFunction(async (user: CurrentUser) => {
  return await user.signOut();
});

export function SignOut(props: { fullPage?: boolean }) {
  const user = useUser();

  if (user) {
    React.use(cacheSignOut(user));
  }

  return <PredefinedMessageCard type="signedOut" fullPage={props.fullPage} />;
}
