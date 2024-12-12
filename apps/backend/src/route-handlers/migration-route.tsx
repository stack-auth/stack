import { yupValidate } from "@stackframe/stack-shared/dist/schema-fields";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { pick, typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { SmartRequest, createSmartRequest } from "./smart-request";
import { SmartResponse, createResponse } from "./smart-response";


const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

type Endpoints = {
  [key: string]: {
    [key in (typeof allowedMethods)[number]]?: (req: NextRequest) => Promise<NextResponse>
  },
};

function urlMatch(url: string, nextPattern: string): Record<string, any> | null {
  const keys: string[] = [];

  const regexPattern = nextPattern
    // match (name)
    .replace(/\/\(.*?\)/g, '')
    // match [...]
    .replace(/\[\.\.\.\]/g, '.*')
    // match [...name]
    .replace(/\[\.\.\.\w+\]/g, (match) => {
      const key = match.slice(1, -1);
      keys.push(key);
      return '(.*?)';
    })
    // match [name]
    .replace(/\[\w+\]/g, (match) => {
      const key = match.slice(1, -1);
      keys.push(key);
      return '([^/]+)';
    });

  const regex = new RegExp(`^${regexPattern}$`);
  const match = regex.exec(url);

  if (!match) return null;

  const result: Record<string, any> = {};
  keys.forEach((key, index) => {
    const value = match[index + 1];
    if (key.startsWith('...')) {
      result[key.slice(3)] = value.split('/');
    } else {
      result[key] = value;
    }
  });

  return result;
}

type ParsedRequest = Pick<SmartRequest, "url" | "method" | "body" | "headers" | "query" | "params">;
type ParsedResponse = SmartResponse;

async function convertRawToParsedRequest(req: NextRequest, schema: yup.Schema, options?: { params: Promise<Record<string, string>> }): Promise<ParsedRequest> {
  const bodyBuffer = await req.arrayBuffer();
  const smartRequest = await createSmartRequest(req, bodyBuffer, options);
  const parsedRequest = pick(smartRequest, ["url", "method", "body", "headers", "query", "params"]);
  return await yupValidate(schema, parsedRequest);
}

async function convertParsedRequestToRaw(req: ParsedRequest): Promise<NextRequest> {
  const url = new URL(req.url);

  for (const [key, value] of Object.entries(req.query)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  return new NextRequest(url.toString(), {
    body: JSON.stringify(req.body),
    method: req.method,
    headers: typedFromEntries(Object.entries(req.headers)
      .map(([key, value]): [string, string | undefined] => [key, (value?.constructor === Array ? value.join(',') : value) as string | undefined])
      .filter(([_, value]) => value !== undefined)) as HeadersInit,
  });
}

async function convertParsedResponseToRaw(req: NextRequest, response: ParsedResponse, schema: yup.Schema): Promise<Response> {
  const requestId = generateSecureRandomString(80);
  return await createResponse(req, requestId, response, schema);
}

// async function createSmartResponseFromResponse

export function createMigrationRoute(newEndpoints: Endpoints) {
  return typedFromEntries(allowedMethods.map((method) => {
    return [method, (req: NextRequest) => {
      for (const [url, endpointMethods] of Object.entries(newEndpoints)) {
        const match = urlMatch(new URL(req.url).pathname.replace('v2', 'v1'), url);
        if (!match) {
          return new NextResponse(null, { status: 404 });
        } else {
          if (endpointMethods[method]) {
            return NextResponse.json({ match, url: req.url, nextUrl: url });
          } else {
            return new NextResponse(null, { status: 405 });
          }
        }
      }
    }];
  }));
}

