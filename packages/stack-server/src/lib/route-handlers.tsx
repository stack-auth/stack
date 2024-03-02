import { NextRequest } from "next/server";
import { StatusError } from "stack-shared/dist/utils/errors";
import * as yup from "yup";

export async function parseRequest<T>(req: NextRequest, schema: yup.Schema<T>): Promise<T> {
  const urlObject = new URL(req.url);
  let body: unknown = req.body;
  switch (req.headers.get("content-type")?.split(";")[0]) {
    case "application/json": {
      try {
        body = await req.json();
      } catch (e) {
        throw new StatusError(400, "Invalid JSON in request body");
      }
      break;
    }
    case "text/plain": {
      try {
        body = await req.text();
      } catch (e) {
        throw new StatusError(400, "Invalid text in request body");
      }
      break;
    }
    case "application/x-www-form-urlencoded": {
      try {
        body = Object.fromEntries(new URLSearchParams(await req.text()).entries());
      } catch (e) {
        throw new StatusError(400, "Invalid form data in request body");
      }
      break;
    }
    default: {
      body = req.body;
    }
  }
  const toValidate = {
    url: req.url,
    method: req.method,
    body: body,
    headers: Object.fromEntries(req.headers.entries()),
    query: Object.fromEntries(urlObject.searchParams.entries()),
  };

  try {
    const validated = await schema.validate(toValidate, {
      abortEarly: false,
      stripUnknown: true,
    });
    return validated;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new StatusError(400, error.errors.join("\n\n"));
    }
    throw error;
  }
}

/**
 * Catches any errors thrown in the handler and returns a 500 response with the thrown error message. Also logs the
 * request details.
 */
export function smartRouteHandler(handler: (req: NextRequest, options: any) => Promise<Response>): (req: NextRequest, options: any) => Promise<Response> {
  return async (req: NextRequest, options: any) => {
    try {
      const censoredUrl = new URL(req.url);
      for (const key of censoredUrl.searchParams.keys()) {
        censoredUrl.searchParams.set(key, "--REDACTED--");
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

      let statusError;
      if (!(e instanceof StatusError)) {
        console.error(`Unhandled error in route handler:`, e, (e as any).constructor);
        statusError = new StatusError(StatusError.InternalServerError);
      } else {
        statusError = e;
      }

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
