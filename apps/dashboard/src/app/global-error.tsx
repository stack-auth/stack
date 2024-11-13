"use client";

import * as Sentry from "@sentry/nextjs";
import { Spinner } from "@stackframe/stack-ui";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: any) {
  const isProdLike = process.env.NODE_ENV.includes("production");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    setTimeout(() => {
      if (isProdLike && !cancelled) {
        window.location.assign("/");
      }
    }, 20);
    return () => {
      cancelled = true;
    };
  }, [isProdLike]);

  return (
    <html>
      <body>
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
