"use client";

import { useStackApp } from "../..";
import MessageCard from "./message-card";
import { Text } from "../../components-core";
import { KnownError } from "@stackframe/stack-shared";

export default function KnownErrorMessageCard({ 
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
      {<Text>Error Code: {error.errorCode}</Text>}
      {<Text>Error Message: {error.message}</Text>}
    </MessageCard>
  );
}
