'use client';

import { use } from "react";
import { useStackApp, useUser } from "..";
import GoHomeMessageCard from "../components/redirect-message-card";

export default function Signout() {
  const user = useUser();
  const app = useStackApp();
  
  if (user) {
    use(user.signOut());
  }
  
  return <GoHomeMessageCard type='signedOut' fullPage />;
}