import { PrismaInstrumentation } from "@prisma/instrumentation";
import * as Sentry from "@sentry/nextjs";
import { getEnvVariable, getNextRuntime, getNodeEnvironment } from "@stackframe/stack-shared/dist/utils/env";
import { nicify } from "@stackframe/stack-shared/dist/utils/strings";
import { registerOTel } from '@vercel/otel';
import "./polyfills";

export function register() {
  registerOTel({
    serviceName: 'stack-backend',
    instrumentations: [new PrismaInstrumentation()],
  });

  if (getNextRuntime() === "nodejs" || getNextRuntime() === "edge") {
    Sentry.init({
      dsn: getEnvVariable("NEXT_PUBLIC_SENTRY_DSN", ""),

      ignoreErrors: [
        // React throws these errors when used with some browser extensions (eg. Google Translate)
        "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
        "NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
      ],

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      enabled: getNodeEnvironment() !== "development" && !getEnvVariable("CI", ""),

      // Add exception metadata to the event
      beforeSend(event, hint) {
        const error = hint.originalException;
        let nicified;
        try {
          nicified = nicify(error, { maxDepth: 8 });
        } catch (e) {
          nicified = `Error occurred during nicification: ${e}`;
        }
        if (error instanceof Error) {
          event.extra = {
            ...event.extra,
            cause: error.cause,
            errorProps: {
              ...error,
            },
            nicifiedError: nicified,
          };
        }
        return event;
      },
    });

  }
}
