import "../polyfills";

import { NextRequest } from "next/server";
import { StackAssertionError, StatusError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { KnownError, KnownErrors } from "@stackframe/stack-shared/dist/known-errors";
import { runAsynchronously, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { MergeSmartRequest, SmartRequest, DeepPartialSmartRequestWithSentinel, createSmartRequest, validateSmartRequest } from "./smart-request";
import { SmartResponse, createResponse } from "./smart-response";
import { EndpointDocumentation } from "@stackframe/stack-shared/dist/crud";
import { getNodeEnvironment } from "@stackframe/stack-shared/dist/utils/env";
import { yupMixed } from "@stackframe/stack-shared/dist/schema-fields";

class InternalServerError extends StatusError {
  constructor(error: unknown) {
    super(
      StatusError.InternalServerError,
      ["development", "test"].includes(getNodeEnvironment()) ? `Internal Server Error. The error message follows, but will be stripped in production. ${error}` : `Something went wrong. Please make sure the data you entered is correct.`,
    );
  }
}

/**
 * Known errors that are common and should not be logged with their stacktrace.
 */
const commonErrors = [
  ...getNodeEnvironment() === "development" ? [KnownError] : [],
  KnownErrors.AccessTokenExpired,
  KnownErrors.CannotGetOwnUserWithoutUser,
  InternalServerError,
];

/**
 * Catches the given error, logs it if needed and returns it as a StatusError. Errors that are not actually errors
 * (such as Next.js redirects) will be re-thrown.
 */
function catchError(error: unknown): StatusError {
  // catch some Next.js non-errors and rethrow them
  if (error instanceof Error) {
    const digest = (error as any)?.digest;
    if (typeof digest === "string") {
      if (["NEXT_REDIRECT", "DYNAMIC_SERVER_USAGE"].some(m => digest.startsWith(m))) {
        throw error;
      }
    }
  }

  if (error instanceof StatusError) return error;
  captureError(`route-handler`, error);
  return new InternalServerError(error);
}

/**
 * Catches any errors thrown in the handler and returns a 500 response with the thrown error message. Also logs the
 * request details.
 */
function handleApiRequest(handler: (req: NextRequest, options: any, requestId: string) => Promise<Response>): (req: NextRequest, options: any) => Promise<Response> {
  return async (req: NextRequest, options: any) => {
    const requestId = generateSecureRandomString(80);
    let hasRequestFinished = false;
    try {
      // censor long query parameters because they might contain sensitive data
      const censoredUrl = new URL(req.url);
      for (const [key, value] of censoredUrl.searchParams.entries()) {
        if (value.length <= 8) {
          continue;
        }
        censoredUrl.searchParams.set(key, value.slice(0, 4) + "--REDACTED--" + value.slice(-4));
      }

      // request duration warning
      const warnAfterSeconds = 12;
      runAsynchronously(async () => {
        await wait(warnAfterSeconds * 1000);
        if (!hasRequestFinished) {
          captureError("request-timeout-watcher", new Error(`Request with ID ${requestId} to endpoint ${req.nextUrl.pathname} has been running for ${warnAfterSeconds} seconds. Try to keep requests short. The request may be cancelled by the serverless provider if it takes too long.`));
        }
      });

      console.log(`[API REQ] [${requestId}] ${req.method} ${censoredUrl}`);
      const timeStart = performance.now();
      const res = await handler(req, options, requestId);
      const time = (performance.now() - timeStart);
      console.log(`[    RES] [${requestId}] ${req.method} ${censoredUrl} (in ${time.toFixed(0)}ms)`);
      return res;
    } catch (e) {
      let statusError: StatusError;
      try {
        statusError = catchError(e);
      } catch (e) {
        console.log(`[    EXC] [${requestId}] ${req.method} ${req.url}: Non-error caught (such as a redirect), will be re-thrown. Digest: ${(e as any)?.digest}`);
        throw e;
      }

      console.log(`[    ERR] [${requestId}] ${req.method} ${req.url}: ${statusError.message}`);
      if (!commonErrors.some(e => statusError instanceof e)) {
        console.debug(`For the error above with request ID ${requestId}, the full error is:`, statusError);
      }

      const res = await createResponse(req, requestId, {
        statusCode: statusError.statusCode,
        bodyType: "binary",
        body: statusError.getBody(),
        headers: {
          ...statusError.getHeaders(),
        },
      }, yupMixed<any>());
      return res;
    } finally {
      hasRequestFinished = true;
    }
  };
}

export type SmartRouteHandlerOverloadMetadata = EndpointDocumentation;

export type SmartRouteHandlerOverload<
  Req extends DeepPartialSmartRequestWithSentinel,
  Res extends SmartResponse,
> = {
  metadata?: SmartRouteHandlerOverloadMetadata,
  request: yup.Schema<Req>,
  response: yup.Schema<Res>,
  handler: (req: MergeSmartRequest<Req>, fullReq: SmartRequest) => Promise<Res>,
};

export type SmartRouteHandlerOverloadGenerator<
  OverloadParam,
  Req extends DeepPartialSmartRequestWithSentinel,
  Res extends SmartResponse,
> = (param: OverloadParam) => SmartRouteHandlerOverload<Req, Res>;

export type SmartRouteHandler<
  OverloadParam = unknown,
  Req extends DeepPartialSmartRequestWithSentinel = DeepPartialSmartRequestWithSentinel,
  Res extends SmartResponse = SmartResponse,
> = ((req: NextRequest, options: any) => Promise<Response>) & {
  overloads: Map<OverloadParam, SmartRouteHandlerOverload<Req, Res>>,
  invoke: (smartRequest: SmartRequest) => Promise<Response>,
}

function getSmartRouteHandlerSymbol() {
  return Symbol.for("stack-smartRouteHandler");
}

export function isSmartRouteHandler(handler: any): handler is SmartRouteHandler {
  return handler?.[getSmartRouteHandlerSymbol()] === true;
}

export function createSmartRouteHandler<
  Req extends DeepPartialSmartRequestWithSentinel,
  Res extends SmartResponse,
>(
  handler: SmartRouteHandlerOverload<Req, Res>,
): SmartRouteHandler<void, Req, Res>
export function createSmartRouteHandler<
  OverloadParam,
  Req extends DeepPartialSmartRequestWithSentinel,
  Res extends SmartResponse,
>(
  overloadParams: readonly OverloadParam[],
  overloadGenerator: SmartRouteHandlerOverloadGenerator<OverloadParam, Req, Res>
): SmartRouteHandler<OverloadParam, Req, Res>
export function createSmartRouteHandler<
  Req extends DeepPartialSmartRequestWithSentinel,
  Res extends SmartResponse,
>(
  ...args: [readonly unknown[], SmartRouteHandlerOverloadGenerator<unknown, Req, Res>] | [SmartRouteHandlerOverload<Req, Res>]
): SmartRouteHandler<unknown, Req, Res> {
  const overloadParams = args.length > 1 ? args[0] as unknown[] : [undefined];
  const overloadGenerator = args.length > 1 ? args[1]! : () => (args[0] as SmartRouteHandlerOverload<Req, Res>);

  const overloads = new Map(overloadParams.map((overloadParam) => [
    overloadParam,
    overloadGenerator(overloadParam),
  ]));
  if (overloads.size !== overloadParams.length) {
    throw new StackAssertionError("Duplicate overload parameters");
  }

  const invoke = async (nextRequest: NextRequest | null, requestId: string, smartRequest: SmartRequest) => {
    const reqsParsed: [[Req, SmartRequest], SmartRouteHandlerOverload<Req, Res>][] = [];
    const reqsErrors: unknown[] = [];
    for (const [, overload] of overloads.entries()) {
      try {
        const parsedReq = await validateSmartRequest(nextRequest, smartRequest, overload.request);
        reqsParsed.push([[parsedReq, smartRequest], overload]);
      } catch (e) {
        reqsErrors.push(e);
      }
    }
    if (reqsParsed.length === 0) {
      if (reqsErrors.length === 1) {
        throw reqsErrors[0];
      } else {
        const caughtErrors = reqsErrors.map(e => catchError(e));
        throw createOverloadsError(caughtErrors);
      }
    }

    const smartReq = reqsParsed[0][0][0];
    const fullReq = reqsParsed[0][0][1];
    const handler = reqsParsed[0][1];

    const smartRes = await handler.handler(smartReq as any, fullReq);

    return await createResponse(nextRequest, requestId, smartRes, handler.response);
  };

  return Object.assign(handleApiRequest(async (req, options, requestId) => {
    const bodyBuffer = await req.arrayBuffer();
    const smartRequest = await createSmartRequest(req, bodyBuffer, options);
    return await invoke(req, requestId, smartRequest);
  }), {
    [getSmartRouteHandlerSymbol()]: true,
    invoke: (smartRequest: SmartRequest) => invoke(null, "custom-endpoint-invocation", smartRequest),
    overloads,
  });
}

function createOverloadsError(errors: StatusError[]) {
  const merged = mergeOverloadErrors(errors);
  if (merged.length === 1) {
    return merged[0];
  }
  return new KnownErrors.AllOverloadsFailed(merged.map(e => e.toDescriptiveJson()));
}

const mergeErrorPriority = [
  // any other error is first, then errors get priority in the following order
  // if an error has priority over another, the latter will be hidden when listing failed overloads
  KnownErrors.InsufficientAccessType,
];

function mergeOverloadErrors(errors: StatusError[]): StatusError[] {
  if (errors.length > 6) {
    // TODO fix this
    throw new StackAssertionError("Too many overloads failed, refusing to trying to merge them as it would be computationally expensive and could be used for a DoS attack. Fix this if we ever have an endpoint with > 8 overloads");
  } else if (errors.length === 0) {
    throw new StackAssertionError("No errors to merge");
  } else if (errors.length === 1) {
    return [errors[0]];
  } else if (errors.length === 2) {
    for (const [a, b] of [errors, [...errors].reverse()]) {
      // Merge errors with the same JSON
      if (JSON.stringify(a.toDescriptiveJson()) === JSON.stringify(b.toDescriptiveJson())) {
        return [a];
      }

      // Merge "InsufficientAccessType" errors
      if (
        a instanceof KnownErrors.InsufficientAccessType
        && b instanceof KnownErrors.InsufficientAccessType
        && a.constructorArgs[0] === b.constructorArgs[0]
      ) {
        return [new KnownErrors.InsufficientAccessType(a.constructorArgs[0], [...new Set([...a.constructorArgs[1], ...b.constructorArgs[1]])])];
      }

      // Merge priority
      const aPriority = mergeErrorPriority.indexOf(a.constructor as any);
      const bPriority = mergeErrorPriority.indexOf(b.constructor as any);
      if (aPriority < bPriority) {
        return [a];
      }
    }
    return errors;
  } else {
    // brute-force all combinations recursively
    let fewestErrors: StatusError[] = errors;
    for (let i = 0; i < errors.length; i++) {
      const errorsWithoutCurrent = [...errors];
      errorsWithoutCurrent.splice(i, 1);
      const mergedWithoutCurrent = mergeOverloadErrors(errorsWithoutCurrent);
      if (mergedWithoutCurrent.length < errorsWithoutCurrent.length) {
        const merged = mergeOverloadErrors([errors[i], ...mergedWithoutCurrent]);
        if (merged.length < fewestErrors.length) {
          fewestErrors = merged;
        }
      }
    }
    return fewestErrors;
  }
}

/**
 * needed in the multi-overload smartRouteHandler for weird TypeScript reasons that I don't understand
 *
 * if you can remove this wherever it's used without causing type errors, it's safe to remove
 */
export function routeHandlerTypeHelper<Req extends DeepPartialSmartRequestWithSentinel, Res extends SmartResponse>(handler: {
  request: yup.Schema<Req>,
  response: yup.Schema<Res>,
  handler: (req: Req & MergeSmartRequest<Req>, fullReq: SmartRequest) => Promise<Res>,
}): {
  request: yup.Schema<Req>,
  response: yup.Schema<Res>,
  handler: (req: Req & MergeSmartRequest<Req>, fullReq: SmartRequest) => Promise<Res>,
} {
  return handler;
}
