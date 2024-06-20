"use client";

import { useStackApp } from "../..";
import Typography from "../ui/typography";
import { MessageCard } from "./message-card";
import { KnownError } from "@stackframe/stack-shared";

export function KnownErrorMessageCard({ 
  error,
  fullPage=false,
}: { 
  error: KnownError,
  fullPage?: boolean, 
}) {
  const stackApp = useStackApp();

  return (
    <MessageCard 
      title={"An error occurred"}
      fullPage={fullPage} 
      primaryButtonText={"Go to Home"}
      primaryAction={() => stackApp.redirectToHome()}
    >
      {<Typography>Error Code: {error.errorCode}</Typography>}
      {<Typography>Error Message: {error.message}</Typography>}
    </MessageCard>
  );
}
