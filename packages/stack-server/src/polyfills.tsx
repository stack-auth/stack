import { registerErrorSink } from "@stackframe/stack-shared/dist/utils/errors";
import * as Sentry from "@sentry/nextjs";

const sentryErrorSink = (location: string, error: unknown) => {
  console.log("YAAAA");
  Sentry.captureException(error, { extra: { location } });
};

export function ensurePolyfilled() {
  registerErrorSink(sentryErrorSink);
}

ensurePolyfilled();
