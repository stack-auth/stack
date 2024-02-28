'use client';

import { use } from "react";
import { useUser } from "..";
import GoHomeMessageCard from "../elements/RedirectMessageCard";

export default function Signout({ redirectUrl }: { redirectUrl?: string }) {
  const user = useUser();
  
  if (user) {
    use(user.signOut(redirectUrl));
  }
  
  return <GoHomeMessageCard type='signedOut' fullPage />;
}