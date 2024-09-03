import * as Sentry from "@sentry/nextjs";
import * as util from "util";
import { registerErrorSink } from "@stackframe/stack-shared/dist/utils/errors";

const sentryErrorSink = (location: string, error: unknown) => {
  Sentry.captureException(error, { extra: { location } });
};

export function ensurePolyfilled() {
  registerErrorSink(sentryErrorSink);
  // not all environments have default options for util.inspect
  if ("inspect" in util && "defaultOptions" in util.inspect) {
    util.inspect.defaultOptions.depth = 8;
  }
}

ensurePolyfilled();
