import { yupValidate } from "@stackframe/stack-shared/dist/schema-fields";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { FilterUndefined, pick, typedEntries, typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { allowedMethods, createSmartRequest } from "./smart-request";
import { createResponse } from "./smart-response";

type BodyType = 'json' | 'text' | 'binary' | 'success' | 'empty';

export type EndpointInputSchema<
  Query extends yup.Schema,
  Body extends yup.Schema
> = {
  query: Query,
  body: Body,
};

export type EndpointOutputSchema<
  StatusCode extends number[],
  T extends BodyType,
  Body extends yup.Schema | undefined
> = {
  statusCode: StatusCode,
  bodyType: T,
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
      [overload: string]: (req: ParsedRequest<any, any>, options?: { params: Promise<Record<string, string>> }) => Promise<ParsedResponse>,
    }
  },
};

export type RawEndpointsHandlers = {
  [url: string]: {
    [method in (typeof allowedMethods)[number]]?: (req: NextRequest) => Promise<NextResponse>
  },
}

type ExtractInputOutputFromEndpointsSchema<
  S extends EndpointsSchema,
  U extends keyof S,
  M extends typeof allowedMethods[number],
  O extends keyof S[U][M],
> = NonNullable<S[U][M]>[O]

export type ParsedRequestFromSchema<
  S extends EndpointsSchema,
  url extends keyof S,
  method extends (typeof allowedMethods)[number],
  overload extends keyof S[url][method]
> = ParsedRequest<
  yup.InferType<ExtractInputOutputFromEndpointsSchema<S, url, method, overload>['input']['body']>,
  yup.InferType<ExtractInputOutputFromEndpointsSchema<S, url, method, overload>['input']['query']>
>

export type ParsedResponseFromSchema<
  S extends EndpointsSchema,
  url extends keyof S,
  method extends (typeof allowedMethods)[number],
  overload extends keyof S[url][method]
> = {
  bodyType: ExtractInputOutputFromEndpointsSchema<S, url, method, overload>['output']['bodyType'],
  statusCode: ExtractInputOutputFromEndpointsSchema<S, url, method, overload>['output']['statusCode'][number],
  body: yup.InferType<ExtractInputOutputFromEndpointsSchema<S, url, method, overload>['output']['body']>,
}

type EndpointHandlersFromSchema<S extends EndpointsSchema> = {
  [url in keyof S]: {
    [method in (typeof allowedMethods)[number]]: {
      [overload in keyof S[url][method]]: (
        req: ParsedRequestFromSchema<S, url, method, overload>,
        options?: { params: Promise<Record<string, string>> }
      ) => Promise<ParsedResponseFromSchema<S, url, method, overload>>
    }
  }
}

// given an object, return the object it self if at least one key exists, otherwise return undefined
type UndefinedIfNoKey<T> = keyof T extends never ? undefined : T;
type FilterUndefinedAndEmpty<T> = UndefinedIfNoKey<FilterUndefined<T>>;

export type TransformFn<
  Old extends EndpointsSchema,
  Handlers extends EndpointHandlers,
  url extends keyof Old,
  method extends (typeof allowedMethods)[number],
  overload extends keyof Old[url][method]
> = (options: {
  req: ParsedRequestFromSchema<Old, url, method, overload>,
  options?: { params: Promise<Record<string, string>> },
  newEndpointHandlers: Handlers,
}) => Promise<ParsedResponseFromSchema<Old, url, method, overload>>

export type EndpointTransforms<
  Old extends EndpointsSchema,
  New extends EndpointsSchema,
  Handlers extends EndpointHandlers,
> = FilterUndefinedAndEmpty<{
  [url in keyof Old]: FilterUndefinedAndEmpty<{
    [method in (typeof allowedMethods)[number]]: method extends keyof Old[url] ?
      FilterUndefinedAndEmpty<{
        [overload in keyof Old[url][method]]:
          url extends keyof New
            ? Old[url][method][overload] extends New[url][method][overload]
              ? undefined
              : TransformFn<Old, Handlers, url, method, overload>
            : TransformFn<Old, Handlers, url, method, overload>
      }>
      : undefined
  }>
}>

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
type ParsedResponse = {
  statusCode: number,
  bodyType: BodyType,
  body?: any,
}

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

async function convertParsedResponseToRaw(
  req: NextRequest,
  response: ParsedResponse,
  schema: yup.Schema
): Promise<Response> {
  const requestId = generateSecureRandomString(80);
  return await createResponse(req, requestId, response, schema);
}

async function convertRawToParsedResponse<
  Body extends yup.Schema,
  StatusCode extends number[],
  T extends BodyType,
>(
  res: NextResponse,
  schema: EndpointOutputSchema<StatusCode, T, Body>
): Promise<{
  statusCode: StatusCode[number],
  bodyType: T,
  body: yup.InferType<Body>,
}> {
  // TODO validate schema
  let contentType = res.headers.get("content-type");
  if (contentType) {
    contentType = contentType.split(";")[0];
  }

  let result: ParsedResponse;

  switch (contentType) {
    case "application/json": {
      result = {
        statusCode: res.status,
        body: await res.json(),
        bodyType: "json" as T,
      };
      break;
    }
    case "text/plain": {
      result = {
        statusCode: res.status,
        body: await res.text(),
        bodyType: "text" as T,
      };
      break;
    }
    case "binary": {
      result = {
        statusCode: res.status,
        body: await res.arrayBuffer(),
        bodyType: "binary" as T,
      };
      break;
    }
    case "success": {
      result = {
        statusCode: res.status,
        body: undefined,
        bodyType: "success" as T,
      };
      break;
    }
    case undefined: {
      result = {
        statusCode: res.status,
        body: undefined,
        bodyType: "empty" as T,
      };
      break;
    }
    default: {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  return result as any;
}

export function createMigrationRoute(endpointHandlers: EndpointHandlers) {
  return typedFromEntries(allowedMethods.map((method) => {
    return [method, async (req: NextRequest) => {
      for (const [url, endpointMethods] of Object.entries(endpointHandlers)) {
        // TODO fix this
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

function createEndpointHandlers<
  S extends EndpointsSchema,
>(
  oldEndpointsSchema: S,
  getHandler: (
    url: string,
    method: typeof allowedMethods[number],
    overload: string,
    endpointSchema: EndpointInputSchema<any, any>
  ) => (
    req: ParsedRequest<any, any>,
    options?: { params: Promise<Record<string, string>> }
  ) => Promise<ParsedResponse>,
) {
  const endpointHandlers = {};
  for (const [url, endpointMethods] of typedEntries(oldEndpointsSchema)) {
    const urlHandlers = {};
    for (const [method, overloads] of typedEntries(endpointMethods)) {
      if (!overloads) continue;

      const methodHandlers = {};
      for (const [overload, endpointSchema] of typedEntries(overloads)) {
        (methodHandlers as any)[overload] = getHandler(
          url as string,
          method as typeof allowedMethods[number],
          overload as string,
          endpointSchema as EndpointInputSchema<any, any>
        );
      }
      (urlHandlers as any)[method] = methodHandlers;
    }
    (endpointHandlers as any)[url] = urlHandlers;
  }

  return endpointHandlers as any;
}

export function createMigrationEndpointHandlers<
  Old extends EndpointsSchema,
  New extends EndpointsSchema,
  Handlers extends EndpointHandlers,
>(
  oldEndpointsSchema: Old,
  newEndpointsSchema: New,
  newEndpointsHandlers: Handlers,
  transforms: EndpointTransforms<Old, New, Handlers>,
): EndpointHandlersFromSchema<Old> {
  return createEndpointHandlers(
    oldEndpointsSchema,
    (url, method, overload, endpointSchema) => async (req: ParsedRequest<any, any>): Promise<ParsedResponse> => {
      // TODO add validation
      let transformedRequest = req;
      const transform = (transforms as any)[url]?.[method]?.[overload];
      if (transform) {
        return transform({ req, newEndpointHandlers: newEndpointsHandlers });
      } else {
        const endpoint = (newEndpointsHandlers as any)[url]?.[method];

        if (!endpoint) {
          throw new Error(`No endpoint found for ${method.toString()} ${url.toString()}`);
        }

        return endpoint[overload](transformedRequest);
      }
    }
  );
}

export function createEndpointHandlersFromRawEndpoints<
  H extends RawEndpointsHandlers,
  S extends EndpointsSchema,
  E extends EndpointHandlersFromSchema<S>
>(rawEndpointHandlers: H, endpointsSchema: S): E {
  return createEndpointHandlers(
    endpointsSchema,
    (url, method, overload, endpointSchema) => async (req: ParsedRequest<any, any>): Promise<ParsedResponse> => {
      const endpoint = (rawEndpointHandlers as any)[url]?.[method];

      if (!endpoint) {
        throw new Error(`No endpoint found for ${method.toString()} ${url.toString()}`);
      }

      const rawRequest = await convertParsedRequestToRaw(req);
      const rawResponse = await endpoint(rawRequest);
      return await convertRawToParsedResponse(rawResponse, (endpointSchema as any).output);
    }
  );
}
