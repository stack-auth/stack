import "../polyfills";

import { NextRequest } from "next/server";
import { StatusError, captureError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";
import { DeepPartial } from "@stackframe/stack-shared/dist/utils/objects";
import { Json } from "@stackframe/stack-shared/dist/utils/json";
import { groupBy, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

export type SmartRequest = {
  url: string,
  method: typeof allowedMethods[number],
  body: unknown,
  headers: Record<string, string[]>,
  query: Record<string, string>,
  params: Record<string, string>,
};

export type SmartResponse = {
  statusCode: number,
  headers?: Record<string, string[]>,
} & (
  | {
    bodyType?: undefined,
    body: ArrayBuffer | Json,
  }
  | {
    bodyType: "text",
    body: string,
  }
  | {
    bodyType: "json",
    body: Json,
  }
  | {
    bodyType: "binary",
    body: ArrayBuffer,
  }
);


async function validate<T>(obj: unknown, schema: yup.Schema<T>): Promise<T> {
  try {
    return await schema.validate(obj, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new StatusError(400, error.errors.join("\n\n"));
    }
    throw error;
  }
}

async function parseBody(req: NextRequest): Promise<SmartRequest["body"]> {
  const contentType = req.headers.get("content-type")?.split(";")[0];
  switch (contentType) {
    case "":
    case undefined: {
      return undefined;
    }
    case "application/json": {
      try {
        return await req.json();
      } catch (e) {
        throw new StatusError(400, "Invalid JSON in request body");
      }
    }
    case "application/octet-stream": {
      return await req.arrayBuffer();
    }
    case "text/plain": {
      try {
        return await req.text();
      } catch (e) {
        throw new StatusError(400, "Invalid text in request body");
      }
    }
    case "application/x-www-form-urlencoded": {
      try {
        return Object.fromEntries(new URLSearchParams(await req.text()).entries());
      } catch (e) {
        throw new StatusError(400, "Invalid form data in request body");
      }
    }
    default: {
      throw new StatusError(400, "Unknown content type in request body: " + contentType);
    }
  }
}

async function parseRequest<T extends DeepPartial<SmartRequest>>(req: NextRequest, schema: yup.Schema<T>, options?: { params: Record<string, string> }): Promise<T> {
  const urlObject = new URL(req.url);  
  const toValidate: SmartRequest = {
    url: req.url,
    method: typedIncludes(allowedMethods, req.method) ? req.method : throwErr(new StatusError(405, "Method not allowed")),
    body: await parseBody(req),
    headers: Object.fromEntries(
      [...groupBy(req.headers.entries(), ([key, _]) => key.toLowerCase())]
        .map(([key, values]) => [key, values.map(([_, value]) => value)]),
    ),
    query: Object.fromEntries(urlObject.searchParams.entries()),
    params: options?.params ?? {},
  };

  return await validate(toValidate, schema);
}

export async function deprecatedParseRequest<T extends DeepPartial<Omit<SmartRequest, "headers"> & { headers: Record<string, string> }>>(req: NextRequest, schema: yup.Schema<T>, options?: { params: Record<string, string> }): Promise<T> {
  const urlObject = new URL(req.url);  
  const toValidate: Omit<SmartRequest, "headers"> & { headers: Record<string, string> } = {
    url: req.url,
    method: typedIncludes(allowedMethods, req.method) ? req.method : throwErr(new StatusError(405, "Method not allowed")),
    body: await parseBody(req),
    headers: Object.fromEntries([...req.headers.entries()].map(([k, v]) => [k.toLowerCase(), v])),
    query: Object.fromEntries(urlObject.searchParams.entries()),
    params: options?.params ?? {},
  };

  return await validate(toValidate, schema);
}


function isBinaryBody(body: unknown): body is BodyInit {
  return body instanceof ArrayBuffer
    || body instanceof SharedArrayBuffer
    || body instanceof Blob
    || ArrayBuffer.isView(body);
}

async function createResponse<T extends SmartResponse>(req: NextRequest, requestId: string, obj: T, schema: yup.Schema<T>): Promise<Response> {
  const validated = await validate(obj, schema);

  let status = validated.statusCode;
  const headers = new Map<string, string[]>;

  const bodyType = validated.bodyType ?? (isBinaryBody(validated.body) ? "binary" : "json");
  let arrayBufferBody;
  switch (bodyType) {
    case "json": {
      headers.set("content-type", ["application/json; charset=utf-8"]);
      arrayBufferBody = new TextEncoder().encode(JSON.stringify(validated.body));
      break;
    }
    case "text": {
      headers.set("content-type", ["text/plain; charset=utf-8"]);
      if (typeof validated.body !== "string") throw new Error(`Invalid body, expected string, got ${validated.body}`);
      arrayBufferBody = new TextEncoder().encode(validated.body);
      break;
    }
    case "binary": {
      if (!isBinaryBody(validated.body)) throw new Error(`Invalid body, expected ArrayBuffer, got ${validated.body}`);
      arrayBufferBody = validated.body;
      break;
    }
    default: {
      throw new Error(`Invalid body type: ${bodyType}`);
    }
  }


  // Add the request ID to the response headers
  headers.set("x-stack-request-id", [requestId]);


  // If the x-stack-override-error-status header is given, override error statuses to 200
  if (req.headers.has("x-stack-override-error-status") && status >= 400 && status < 600) {
    status = 200;
    headers.set("x-stack-actual-status", [validated.statusCode.toString()]);
  }

  return new Response(
    arrayBufferBody,
    {
      status,
      headers: [
        ...Object.entries({
          ...Object.fromEntries(headers),
          ...validated.headers ?? {}
        }).flatMap(([key, values]) => values.map(v => [key.toLowerCase(), v!] as [string, string])),
      ],
    },
  );
}


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
  return new StatusError(StatusError.InternalServerError);
}

/**
 * Catches any errors thrown in the handler and returns a 500 response with the thrown error message. Also logs the
 * request details.
 */
export function deprecatedSmartRouteHandler(handler: (req: NextRequest, options: any, requestId: string) => Promise<Response>): (req: NextRequest, options: any) => Promise<Response> {
  return async (req: NextRequest, options: any) => {
    const requestId = generateSecureRandomString(80);
    try {
      // censor long query parameters because they might contain sensitive data
      const censoredUrl = new URL(req.url);
      for (const [key, value] of censoredUrl.searchParams.entries()) {
        if (value.length <= 8) {
          continue;
        }
        censoredUrl.searchParams.set(key, value.slice(0, 4) + "--REDACTED--" + value.slice(-4));
      }

      console.log(`[API REQ] [${requestId}] ${req.method} ${censoredUrl}`);
      const timeStart = performance.now();
      const res = await handler(req, options, requestId);
      const time = (performance.now() - timeStart);
      console.log(`[    RES] [${requestId}] ${req.method} ${censoredUrl} (in ${time.toFixed(0)}ms)`);
      return res;
    } catch (e) {
      let statusError;
      try {
        statusError = catchError(e);
      } catch (e) {
        console.log(`[    EXC] [${requestId}] ${req.method} ${req.url}: Non-error caught (such as a redirect), will be rethrown. Digest: ${(e as any)?.digest}`);
        throw e;
      }

      console.log(`[    ERR] [${requestId}] ${req.method} ${req.url}: ${statusError.message}`);
      console.log(`For the error above with request ID ${requestId}, the full error is:`, statusError);

      const res = await createResponse(req, requestId, {
        statusCode: statusError.statusCode,
        bodyType: "binary",
        body: statusError.getBody(),
        headers: {
          ...statusError.getHeaders(),
        },
      }, yup.mixed());
      return res;
    }
  };
};

type SmartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
> = {
  request: yup.Schema<Req>,
  response: yup.Schema<Res>,
  handler: (req: Req) => Promise<Res>,
};

export function smartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
>(
  handler: SmartRouteHandler<Req, Res>,
): (req: NextRequest, options: any) => Promise<Response>;
export function smartRouteHandler<
  OverloadParam,
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
>(
  overloadParams: OverloadParam[],
  overloadGenerator: (param: OverloadParam) => SmartRouteHandler<Req, Res>,
): (req: NextRequest, options: any) => Promise<Response>;
export function smartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
  Res extends SmartResponse,
>(
  ...args: [unknown[], (param: unknown) => SmartRouteHandler<Req, Res>] | [SmartRouteHandler<Req, Res>]
): (req: NextRequest, options: any) => Promise<Response> {
  const overloadParams = args.length > 1 ? args[0] as unknown[] : [undefined];
  const overloadGenerator = args.length > 1 ? args[1]! : () => (args[0] as SmartRouteHandler<Req, Res>);

  return deprecatedSmartRouteHandler(async (req, options, requestId) => {
    const reqsParsed: [Req, SmartRouteHandler<Req, Res>][] = [];
    const reqsErrors: unknown[] = [];
    for (const overloadParam of overloadParams as unknown[]) {
      const handler = overloadGenerator(overloadParam);
      try {
        const parsed = await parseRequest(req, handler.request, options);
        reqsParsed.push([parsed, handler]);
      } catch (e) {
        reqsErrors.push(e);
      }
    }
    if (reqsParsed.length === 0) {
      if (reqsErrors.length === 1) {
        throw reqsErrors[0];
      } else {
        const caughtErrors = reqsErrors.map(e => catchError(e));
        const errorMessage = deindent`
          Could not process request because all available overloads of this endpoint failed to parse it.

            ${caughtErrors.map((e, i) => deindent`
              Overload ${i + 1}: ${e.statusCode}
                ${e.message}
            `).join("\n\n")}
        `;
        throw new KnownErrors.AllOverloadsFailed(caughtErrors.map(e => e.toHttpJson()));
      }
    }

    const smartReq = reqsParsed[0][0];
    const handler = reqsParsed[0][1];

    let smartRes = await handler.handler(smartReq);

    return await createResponse(req, requestId, smartRes, handler.response);
  });
}


export function redirectHandler(redirectPath: string, statusCode: 301 | 302 | 303 | 307 | 308 = 307): (req: NextRequest, options: any) => Promise<Response> {
  return smartRouteHandler({
    request: yup.object({
      url: yup.string().required(),
      method: yup.string().oneOf(["GET"]).required(),
    }),
    response: yup.object({
      statusCode: yup.number().oneOf([301, 302, 303, 307, 308]).required(),
      headers: yup.object().shape({
        location: yup.array(yup.string().required()),
      }),
      bodyType: yup.string().oneOf(["text"]).required(),
      body: yup.string().required(),
    }),
    async handler(req) {
      const urlWithTrailingSlash = new URL(req.url);
      if (!urlWithTrailingSlash.pathname.endsWith("/")) {
        urlWithTrailingSlash.pathname += "/";
      }
      const newUrl = new URL(redirectPath, urlWithTrailingSlash);
      return {
        statusCode,
        headers: {
          location: [newUrl.toString()],
        },
        bodyType: "text",
        body: "Redirecting...",
      };
    },
  });
}
