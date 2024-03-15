'use client';

import { use } from "react";
import { useStackApp, useUser } from "..";
import GoHomeMessageCard from "../elements/RedirectMessageCard";

export default function Signout() {
  const user = useUser();
  const app = useStackApp();
  
  if (user) {
    use(user.signOut());
  }
  
  return <GoHomeMessageCard type='signedOut' fullPage />;
}