"use client";

import { Spinner } from "@/components/ui/spinner";
import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GlobalError({ error }: any) {
  const router = useRouter();
  const isProdLike = process.env.NODE_ENV.includes("production");
  
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    setTimeout(() => {
      if (isProdLike) {
        router.push("/");
      }
    }, 3000);
  }, [router, isProdLike]);

  return (
    <html>
      <body suppressHydrationWarning>
        {isProdLike ? (
          <Spinner />
        ) : (
          <Error
            statusCode={500}
          />
        )}
      </body>
    </html>
  );
}
