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
  body: Json,
  headers: Record<string, string[]>,
};


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

export async function createResponse<T extends DeepPartial<SmartResponse>>(obj: T, schema: yup.Schema<T>): Promise<Response> {
  const validated = await validate(obj, schema);
  
  return new Response(JSON.stringify(validated.body), {
    status: validated.statusCode,
    headers: [
      ..."content-type" in (validated.headers ?? {}) ? [] as const : [["content-type", "application/json"]] as [string, string][],
      ...Object.entries(validated.headers ?? {}).flatMap(([key, values]) => values?.filter(v => v !== undefined).map(v => [key.toLowerCase(), v!] as [string, string]) ?? []),
    ],
  });
}


function catchError(error: unknown): StatusError {
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
      // catch some Next.js non-errors and rethrow them
      if (e instanceof Error) {
        const digest = (e as any)?.digest;
        if (typeof digest === "string") {
          if (["NEXT_REDIRECT", "DYNAMIC_SERVER_USAGE"].some(m => digest.startsWith(m))) {
            throw e;
          }
        }
      }

      const statusError = catchError(e);

      console.log(`[    ERR] ${req.method} ${req.url} : ${statusError.message}`);

      return new Response(statusError.message, {
        status: statusError.statusCode,
        headers: {
          "Content-Type": "text/plain",
          ...statusError.options?.headers ?? {},
        },
      });
    }
  };
};

type SmartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
  Res extends DeepPartial<SmartResponse>,
> = {
  request: yup.Schema<Req>,
  response: yup.Schema<Res>,
  handler: (req: Req) => Promise<Res>,
};

export function smartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
  Res extends DeepPartial<SmartResponse>,
>(
  handler: SmartRouteHandler<Req, Res>,
): (req: NextRequest, options: any) => Promise<Response>;
export function smartRouteHandler<
  OverloadParam,
  Req extends DeepPartial<SmartRequest>,
  Res extends DeepPartial<SmartResponse>,
>(
  overloadParams: OverloadParam[],
  overloadGenerator: (param: OverloadParam) => SmartRouteHandler<Req, Res>,
): (req: NextRequest, options: any) => Promise<Response>;
export function smartRouteHandler<
  Req extends DeepPartial<SmartRequest>,
  Res extends DeepPartial<SmartResponse>,
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
        const parsed = await parseRequest(req, handler.request);
        reqsParsed.push([parsed, handler]);
      } catch (e) {
        reqsErrors.push(e);
      }
    }
    if (reqsParsed.length === 0) {
      if (reqsErrors.length === 1) {
        throw reqsErrors[0];
      } else {
        const reqsCaughtErrors = reqsErrors.map(e => catchError(e));
        const errorMessage = deindent`
          Could not process request because all available overloads of this endpoint failed to parse it.

            ${reqsCaughtErrors.map((e, i) => deindent`
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
