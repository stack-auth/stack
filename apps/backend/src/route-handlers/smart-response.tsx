import "../polyfills";

import { NextRequest } from "next/server";
import * as yup from "yup";
import { Json } from "@stackframe/stack-shared/dist/utils/json";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { deepPlainEquals } from "@stackframe/stack-shared/dist/utils/objects";
import { yupObject } from "@stackframe/stack-shared/dist/schema-fields";

export type SmartResponse = {
  statusCode: number,
  headers?: Record<string, string[]>,
} & (
  | {
    bodyType?: undefined,
    body?: ArrayBuffer | Json | undefined,
  }
  | {
    bodyType: "empty",
    body?: undefined,
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
  | {
    bodyType: "success",
    body?: undefined,
  }
);

async function validate<T>(req: NextRequest | null, obj: unknown, schema: yup.Schema<T>): Promise<T> {
  try {
    return await schema.validate(obj, {
      abortEarly: false,
      context: {
        noUnknownPathPrefixes: [""],
      },
    });
  } catch (error) {
    throw new StackAssertionError(`Error occurred during ${req ? `${req.method} ${req.url}` : "a custom endpoint invocation's"} response validation: ${error}`, { obj, schema, error }, { cause: error });
  }
}


function isBinaryBody(body: unknown): body is BodyInit {
  return body instanceof ArrayBuffer
    || body instanceof SharedArrayBuffer
    || body instanceof Blob
    || ArrayBuffer.isView(body);
}

export async function createResponse<T extends SmartResponse>(req: NextRequest | null, requestId: string, obj: T, schema: yup.Schema<T>): Promise<Response> {
  const validated = await validate(req, obj, schema);

  let status = validated.statusCode;
  const headers = new Map<string, string[]>();

  let arrayBufferBody;

  // if we have something that resembles a browser, prettify JSON outputs
  const jsonIndent = req?.headers.get("Accept")?.includes("text/html") ? 2 : undefined;

  const bodyType = validated.bodyType ?? (validated.body === undefined ? "empty" : isBinaryBody(validated.body) ? "binary" : "json");
  switch (bodyType) {
    case "empty": {
      arrayBufferBody = new ArrayBuffer(0);
      break;
    }
    case "json": {
      if (validated.body === undefined || !deepPlainEquals(validated.body, JSON.parse(JSON.stringify(validated.body)), { ignoreUndefinedValues: true })) {
        throw new StackAssertionError("Invalid JSON body is not JSON", { body: validated.body });
      }
      headers.set("content-type", ["application/json; charset=utf-8"]);
      arrayBufferBody = new TextEncoder().encode(JSON.stringify(validated.body, null, jsonIndent));
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
    case "success": {
      headers.set("content-type", ["application/json; charset=utf-8"]);
      arrayBufferBody = new TextEncoder().encode(JSON.stringify({
        success: true,
      }, null, jsonIndent));
      break;
    }
    default: {
      throw new Error(`Invalid body type: ${bodyType}`);
    }
  }


  // Add the request ID to the response headers
  headers.set("x-stack-request-id", [requestId]);


  // Disable caching by default
  headers.set("cache-control", ["no-store, max-age=0"]);


  // If the x-stack-override-error-status header is given, override error statuses to 200
  if (req?.headers.has("x-stack-override-error-status") && status >= 400 && status < 600) {
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
