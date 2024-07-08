import "../polyfills";

import { NextRequest } from "next/server";
import * as yup from "yup";
import { Json } from "@stackframe/stack-shared/dist/utils/json";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { deepPlainSnakeCaseToCamelCase, filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";

export type SmartResponse = {
  statusCode: number,
  headers?: Record<string, string[]>,
} & (
  | {
    bodyType?: undefined,
    body?: ArrayBuffer | Json,
  }
  | {
    bodyType: "text",
    body?: string,
  }
  | {
    bodyType: "json",
    body?: Json,
  }
  | {
    bodyType: "binary",
    body?: ArrayBuffer,
  }
);

async function validate<T>(req: NextRequest, obj: unknown, schema: yup.Schema<T>): Promise<T> {
  // TODO new backend and stuff
  return obj as T;
}


function isBinaryBody(body: unknown): body is BodyInit {
  return body instanceof ArrayBuffer
    || body instanceof SharedArrayBuffer
    || body instanceof Blob
    || ArrayBuffer.isView(body);
}

async function hackyConvertResponseBodyFromNewToOld(body: any) {
  body = deepPlainSnakeCaseToCamelCase(body);
  if ("oauthProviders" in body) {
    body.oauthProviders = body.oauthProviders.map((provider: any) => {
      return provider.providerId;
    });
  }
}

export async function createResponse<T extends SmartResponse>(req: NextRequest, requestId: string, obj: T, schema: yup.Schema<T>): Promise<Response> {
  const validated = await validate(req, obj, schema);

  let status = validated.statusCode;
  const headers = new Map<string, string[]>;

  let arrayBufferBody;
  if (obj.body === undefined) {
    arrayBufferBody = new ArrayBuffer(0);
  } else {
    const bodyType = validated.bodyType ?? (isBinaryBody(validated.body) ? "binary" : "json");
    switch (bodyType) {
      case "json": {
        headers.set("content-type", ["application/json; charset=utf-8"]);
        arrayBufferBody = new TextEncoder().encode(JSON.stringify(hackyConvertResponseBodyFromNewToOld(validated.body)));
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
  }


  // Add the request ID to the response headers
  headers.set("x-stack-request-id", [requestId]);


  // Disable caching by default
  headers.set("cache-control", ["no-store, max-age=0"]);


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
        ...Object.entries(filterUndefined({
          ...Object.fromEntries(headers),
          ...validated.headers ?? {}
        })).flatMap(([key, values]) => values.map(v => [key.toLowerCase(), v!] as [string, string])),
      ],
    },
  );
}
