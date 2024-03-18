import { NextRequest } from "next/server";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";
import { DeepPartial } from "@stackframe/stack-shared/dist/utils/objects";
import { Json } from "@stackframe/stack-shared/dist/utils/json";
import { groupBy, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

type SmartRequest = {
  url: string,
  method: typeof allowedMethods[number],
  body: unknown,
  headers: Record<string, string[]>,
  query: Record<string, string>,
  params: Record<string, string>,
};

type SmartResponse = {
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
    bodyType: "array-buffer",
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

export async function parseRequest<T extends DeepPartial<SmartRequest>>(req: NextRequest, schema: yup.Schema<T>, options?: { params: Record<string, string> }): Promise<T> {
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

export async function createResponse<T extends SmartResponse>(obj: T, schema: yup.Schema<T>): Promise<Response> {
  const validated = await validate(obj, schema);

  const bodyType = validated.bodyType ?? (validated.body instanceof ArrayBuffer ? "array-buffer" : "json");
  const customContentTypeHeader: [string, string] | null = 
    bodyType === "json" ? ["content-type", "application/json; charset=utf-8"] :
      bodyType === "text" ? ["content-type", "text/plain; charset=utf-8"] :
        bodyType === "array-buffer" ? ["content-type", "application/octet-stream"] :
          throwErr(new Error(`Invalid body type: ${bodyType}`));
  const arrayBufferBody = 
    bodyType === "json" ? new TextEncoder().encode(JSON.stringify(validated.body)) :
      bodyType === "text" ? (typeof validated.body === "string" ? new TextEncoder().encode(validated.body) : throwErr("Invalid body type: expected string")) :
        bodyType === "array-buffer" ? (validated.body instanceof ArrayBuffer ? validated.body : throwErr("Invalid body type: expected ArrayBuffer")) :
          throwErr(new Error(`Invalid body type: ${bodyType}`));
  
  return new Response(
    arrayBufferBody,
    {
      status: validated.statusCode,
      headers: [
        ...!customContentTypeHeader || "content-type" in (validated.headers ?? {}) ? [] as const : [customContentTypeHeader],
        ...Object.entries(validated.headers ?? {}).flatMap(([key, values]) => values.map(v => [key.toLowerCase(), v!] as [string, string])),
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
  console.error(`Unhandled error in route handler:`, error);
  return new StatusError(StatusError.InternalServerError);
}

/**
 * Catches any errors thrown in the handler and returns a 500 response with the thrown error message. Also logs the
 * request details.
 */
export function deprecatedSmartRouteHandler(handler: (req: NextRequest, options: any) => Promise<Response>): (req: NextRequest, options: any) => Promise<Response> {
  return async (req: NextRequest, options: any) => {
    try {
      const censoredUrl = new URL(req.url);
      for (const [key, value] of censoredUrl.searchParams.entries()) {
        if (value.length <= 8) {
          continue;
        }
        censoredUrl.searchParams.set(key, value.slice(0, 4) + "--REDACTED--" + value.slice(-4));
      }

      console.log(`[API REQ] ${req.method} ${censoredUrl}`);
      const timeStart = performance.now();
      const res = await handler(req, options);
      const time = (performance.now() - timeStart);
      console.log(`[    RES] ${req.method} ${censoredUrl} (in ${time.toFixed(0)}ms)`);
      return res;
    } catch (e) {
      let statusError;
      try {
        statusError = catchError(e);
      } catch (e) {
        console.log(`[    EXC] ${req.method} ${req.url}: Non-error caught (such as a redirect), will be rethrown. Digest: ${(e as any)?.digest}`);
        throw e;
      }

      console.log(`[    ERR] ${req.method} ${req.url}: ${statusError.message}`);

      return await createResponse({
        statusCode: statusError.statusCode,
        bodyType: "text",
        body: statusError.message,
        headers: {
          ...statusError.options?.headers ?? {},
        },
      }, yup.mixed());
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

  return deprecatedSmartRouteHandler(async (req, options) => {
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
        const errorMessage = deindent`
          Could not process request because all available overloads of this endpoint failed to parse it.

            ${reqsErrors.map(e => catchError(e)).map((e, i) => deindent`
              Overload ${i + 1}: ${e.statusCode}
                ${e.message}
            `).join("\n\n")}
        `;
        throw new StatusError(400, errorMessage);
      }
    }
    const smartReq = reqsParsed[0][0];
    const handler = reqsParsed[0][1];

    const res = await handler.handler(smartReq);

    return await createResponse(res, handler.response);
  });
}
