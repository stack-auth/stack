import "../polyfills";

import { NextRequest } from "next/server";
import { StackAssertionError, StatusError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";
import { DeepPartial } from "@stackframe/stack-shared/dist/utils/objects";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";
import { runAsynchronously, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { MergeSmartRequest, SmartRequest, createLazyRequestParser } from "./smart-request";
import { SmartResponse, createResponse } from "./smart-response";

class InternalServerError extends StatusError {
  constructor(error: unknown) {
    super(
      StatusError.InternalServerError,
      ...process.env.NODE_ENV === "development" ? [`Internal Server Error: ${error}`] : [],
    );
  }
}

/**
 * Known errors that are common and should not be logged with their stacktrace.
 */
const commonErrors = [
  KnownErrors.AccessTokenExpired,
  InternalServerError,
];

/**
 * Catches the given error, logs it if needed and returns it as a StatusError. Errors that are not actually errors
 * (such as Next.js redirects) will be rethrown.
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
export function deprecatedSmartRouteHandler(handler: (req: NextRequest, options: any, requestId: string) => Promise<Response>): (req: NextRequest, options: any) => Promise<Response> {
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
        console.log(`[    EXC] [${requestId}] ${req.method} ${req.url}: Non-error caught (such as a redirect), will be rethrown. Digest: ${(e as any)?.digest}`);
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
      }, yup.mixed());
      return res;
    } finally {
      hasRequestFinished = true;
    }
  };
};

export type SmartRouteHandlerOverloadMetadata = {
  summary: string,
  description: string,
  tags: string[],
};

export type SmartRouteHandlerOverload<
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
> = {
  metadata?: SmartRouteHandlerOverloadMetadata,
  request: yup.Schema<Req>,
  response: yup.Schema<Res>,
  handler: (req: Req & MergeSmartRequest<Req>, fullReq: SmartRequest) => Promise<Res>,
};

export type SmartRouteHandlerOverloadGenerator<
  OverloadParam,
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
> = (param: OverloadParam) => SmartRouteHandlerOverload<Req, Res>;

export type SmartRouteHandler<
  OverloadParam = unknown,
  Req extends DeepPartial<SmartRequest> = DeepPartial<SmartRequest>,
  Res extends SmartResponse = SmartResponse,
> = ((req: NextRequest, options: any) => Promise<Response>) & {
  overloads: Map<OverloadParam, SmartRouteHandlerOverload<Req, Res>>,
}

const smartRouteHandlerSymbol = Symbol("smartRouteHandler");

export function isSmartRouteHandler(handler: any): handler is SmartRouteHandler {
  return handler?.[smartRouteHandlerSymbol] === true;
}

export function createSmartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
>(
  handler: SmartRouteHandlerOverload<Req, Res>,
): SmartRouteHandler<void, Req, Res>
export function createSmartRouteHandler<
  OverloadParam,
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
>(
  overloadParams: readonly OverloadParam[],
  overloadGenerator: SmartRouteHandlerOverloadGenerator<OverloadParam, Req, Res>
): SmartRouteHandler<OverloadParam, Req, Res>
export function createSmartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
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

  return Object.assign(deprecatedSmartRouteHandler(async (req, options, requestId) => {
    const reqsParsed: [[Req, SmartRequest], SmartRouteHandlerOverload<Req, Res>][] = [];
    const reqsErrors: unknown[] = [];
    const bodyBuffer = await req.arrayBuffer();
    for (const [overloadParam, handler] of overloads.entries()) {
      const requestParser = await createLazyRequestParser(req, bodyBuffer, handler.request, options);
      try {
        const parserRes = await requestParser();
        reqsParsed.push([parserRes, handler]);
      } catch (e) {
        reqsErrors.push(e);
      }
    }
    if (reqsParsed.length === 0) {
      if (reqsErrors.length === 1) {
        throw reqsErrors[0];
      } else {
        const caughtErrors = reqsErrors.map(e => catchError(e));
        throw new KnownErrors.AllOverloadsFailed(caughtErrors.map(e => e.toHttpJson()));
      }
    }

    const smartReq = reqsParsed[0][0][0];
    const fullReq = reqsParsed[0][0][1];
    const handler = reqsParsed[0][1];

    let smartRes = await handler.handler(smartReq as any, fullReq);

    return await createResponse(req, requestId, smartRes, handler.response);
  }), {
    [smartRouteHandlerSymbol]: true,
    overloads,
  });
}

/**
 * needed in the multi-overload smartRouteHandler for weird TypeScript reasons that I don't understand
 *
 * if you can remove this wherever it's used without causing type errors, it's safe to remove
 */
export function routeHandlerTypeHelper<Req extends DeepPartial<SmartRequest>, Res extends SmartResponse>(handler: {
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
