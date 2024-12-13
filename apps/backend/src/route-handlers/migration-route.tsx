import { yupValidate } from "@stackframe/stack-shared/dist/schema-fields";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { pick, typedEntries, typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { createSmartRequest } from "./smart-request";
import { createResponse } from "./smart-response";


const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

export type EndpointInputSchema<Query extends yup.Schema, Body extends yup.Schema> = {
  query: Query,
  body: Body,
};

export type EndpointOutputSchema<StatusCode extends yup.Schema, Headers extends yup.Schema, Body extends yup.Schema> = {
  statusCode: StatusCode,
  headers: Headers,
  body: Body,
};

export type EndpointsSchema = {
  [url: string]: {
    [method in (typeof allowedMethods)[number]]?: {
      [overload: string]: {
        input: EndpointInputSchema<any, any>,
        output: EndpointOutputSchema<any, any, any>,
      },
    }
  },
};

export type EndpointHandlers = {
  [url: string]: {
    [method in (typeof allowedMethods)[number]]?: {
      [overload: string]: (req: ParsedRequest<any, any>, options?: { params: Promise<Record<string, string>> }) => Promise<ParsedResponse<any>>,
    }
  },
};

export type RawEndpointsHandlers = {
  [url: string]: {
    [method in (typeof allowedMethods)[number]]?: (req: NextRequest) => Promise<NextResponse>
  },
}

type EndpointHandlersFromSchema<S extends EndpointsSchema> = {
  [url in keyof S]: {
    [method in (typeof allowedMethods)[number]]: {
      [overload in keyof S[url][method]]: (
        req: ParsedRequest<
          yup.InferType<ExtractSchema<S, url, method, overload, 'input'>['body']>,
          yup.InferType<ExtractSchema<S, url, method, overload, 'input'>['query']>
        >,
        options?: { params: Promise<Record<string, string>> }
      ) => Promise<ParsedResponse<yup.InferType<ExtractSchema<S, url, method, overload, 'output'>['body']>>>
    }
  }
}

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

type ParsedRequest<Body, Query extends Record<string, string | undefined>> = {
  url: string,
  method: typeof allowedMethods[number],
  headers: Record<string, string[] | undefined>,
  body: Body,
  query: Query,
};
type ParsedResponse<Body> = {
  statusCode: number,
  headers?: Record<string, string[]>,
} & (
  | {
    bodyType?: undefined,
    body?: Body,
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
    body: Body,
  }
  | {
    bodyType: "binary",
    body: ArrayBuffer,
  }
  | {
    bodyType: "success",
    body?: undefined,
  }
)

async function convertRawToParsedRequest<Body extends yup.Schema, Query extends yup.Schema>(
  req: NextRequest,
  schema: EndpointInputSchema<Query, Body>,
  options?: { params: Promise<Record<string, string>> }
): Promise<ParsedRequest<
  yup.InferType<Body>,
  yup.InferType<Query>
>> {
  const bodyBuffer = await req.arrayBuffer();
  const smartRequest = await createSmartRequest(req, bodyBuffer, options);
  const parsedRequest = pick(smartRequest, ["url", "method", "body", "headers", "query"]);
  return {
    ...parsedRequest,
    body: await yupValidate(schema.body, parsedRequest.body),
    query: await yupValidate(schema.query, parsedRequest.query),
  };
}

async function convertParsedRequestToRaw(req: ParsedRequest<any, Record<string, string | undefined>>): Promise<NextRequest> {
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

async function convertParsedResponseToRaw(req: NextRequest, response: ParsedResponse<any>, schema: yup.Schema): Promise<Response> {
  const requestId = generateSecureRandomString(80);
  return await createResponse(req, requestId, response, schema);
}

async function convertRawToParsedResponse<Body extends yup.Schema, StatusCode extends yup.Schema, Headers extends yup.Schema>(
  res: NextResponse,
  schema: EndpointOutputSchema<StatusCode, Headers, Body>
): Promise<ParsedResponse<yup.InferType<Body>>> {
  // TODO validate schema
  let contentType = res.headers.get("content-type");
  if (contentType) {
    contentType = contentType.split(";")[0];
  }

  switch (contentType) {
    case "application/json": {
      return {
        statusCode: res.status,
        body: await res.json(),
        bodyType: "json",
      };
    }
    case "text/plain": {
      return {
        statusCode: res.status,
        body: await res.text(),
        bodyType: "text",
      };
    }
    case "binary": {
      return {
        statusCode: res.status,
        body: await res.arrayBuffer(),
        bodyType: "binary",
      };
    }
    case "success": {
      return {
        statusCode: res.status,
        body: undefined,
        bodyType: "success",
      };
    }
    case undefined: {
      return {
        statusCode: res.status,
        body: undefined,
        bodyType: "empty",
      };
    }
    default: {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  }
}

export function createMigrationEndpointHandlers<S extends EndpointsSchema, E extends EndpointHandlers>(
  oldEndpointsSchema: S,
  newEndpointsHandlers: E,
): EndpointHandlersFromSchema<S> {
  return null as any;
}

export function createMigrationRoute(endpointHandlers: EndpointHandlers) {
  return typedFromEntries(allowedMethods.map((method) => {
    return [method, async (req: NextRequest) => {
      for (const [url, endpointMethods] of Object.entries(endpointHandlers)) {
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

type ExtractSchema<S extends EndpointsSchema, U extends keyof S, M extends typeof allowedMethods[number], O extends keyof S[U][M], T extends 'input' | 'output'> = NonNullable<S[U][M]>[O][T]

export function createEndpointHandlersFromRawEndpoints<H extends RawEndpointsHandlers, S extends EndpointsSchema>(rawEndpointHandlers: H, endpointsSchema: S): EndpointHandlersFromSchema<S> {
  const endpointHandlers = {};

  for (const [url, endpointMethods] of typedEntries(endpointsSchema)) {
    const urlHandlers = {};

    for (const [method, overloads] of typedEntries(endpointMethods)) {
      if (!overloads) continue;

      const methodHandlers = {};

      for (const [overload, endpointSchema] of typedEntries(overloads)) {
        const endpoint = (rawEndpointHandlers as any)[url]?.[method];

        if (!endpoint) {
          throw new Error(`No endpoint found for ${method.toString()} ${url.toString()}`);
        }

        (methodHandlers as any)[overload] = async (req: ParsedRequest<any, any>): Promise<ParsedResponse<any>> => {
          // TODO: validate input and output
          const rawRequest = await convertParsedRequestToRaw(req);
          const rawResponse = await (endpoint as any)(rawRequest);
          return await convertRawToParsedResponse(rawResponse, (endpointSchema as any).output);
        };
      }

      (urlHandlers as any)[method] = methodHandlers;
    }

    (endpointHandlers as any)[url] = urlHandlers;
  }

  return endpointHandlers as any;
}
