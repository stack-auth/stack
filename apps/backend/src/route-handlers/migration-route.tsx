import { yupValidate } from "@stackframe/stack-shared/dist/schema-fields";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { pick, typedEntries, typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { createSmartRequest } from "./smart-request";
import { createResponse } from "./smart-response";


const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

type EndpointInputSchema = {
  query: yup.Schema,
  body: yup.Schema,
};

type EndpointOutputSchema = {
  statusCode: yup.Schema,
  headers: yup.Schema,
  body: yup.Schema,
};

type EndpointsSchema = {
  [url: string]: {
    [method in (typeof allowedMethods)[number]]?: {
      [overload: string]: {
        input: EndpointInputSchema,
        output: EndpointOutputSchema,
      },
    }
  },
};

type EndpointHandlers = {
  [url: string]: {
    [method in (typeof allowedMethods)[number]]?: {
      [overload: string]: (req: ParsedRequest<any, any>, options?: { params: Promise<Record<string, string>> }) => Promise<ParsedResponse<any>>,
    }
  },
};

type NewestEndpoints = {
  [url: string]: {
    [method in (typeof allowedMethods)[number]]?: (req: NextRequest) => Promise<NextResponse>
  },
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

async function convertRawToParsedRequest(
  req: NextRequest,
  schema: EndpointInputSchema,
  options?: { params: Promise<Record<string, string>> }
): Promise<ParsedRequest<
  yup.InferType<EndpointInputSchema["body"]>,
  yup.InferType<EndpointInputSchema["query"]>
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

async function convertRawToParsedResponse(res: NextResponse, schema: EndpointOutputSchema): Promise<ParsedResponse<yup.InferType<typeof schema.body>>> {
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

// export function createMigrationRoute(versionsSchema: EndpointsSchema[]) {
//   return typedFromEntries(allowedMethods.map((method) => {
//     return [method, async (req: NextRequest) => {
//       for (const [url, endpointMethods] of Object.entries(newEndpoints)) {
//         const match = urlMatch(new URL(req.url).pathname.replace('v2', 'v1'), url);
//         if (!match) {
//           return new NextResponse(null, { status: 404 });
//         } else {
//           if (endpointMethods[method]) {
//             return NextResponse.json({ match, url: req.url, nextUrl: url });
//           } else {
//             return new NextResponse(null, { status: 405 });
//           }
//         }
//       }
//     }];
//   }));
// }

export function createEndpointHandlersFromNewestEndpoints(newestEndpoints: NewestEndpoints, endpointsSchema: EndpointsSchema) {
  const endpointHandlers: EndpointHandlers = {};

  for (const [url, endpointMethods] of typedEntries(endpointsSchema)) {
    const urlHandlers: EndpointHandlers[string] = {};

    for (const [method, overloads] of typedEntries(endpointMethods)) {
      if (!overloads) continue;

      const methodHandlers: EndpointHandlers[string][typeof allowedMethods[number]] = {};

      for (const [overload, { input, output }] of typedEntries(overloads)) {
        const endpoint = newestEndpoints[url][method];

        if (!endpoint) {
          throw new Error(`No endpoint found for ${method} ${url}`);
        }

        methodHandlers[overload] = async (req: ParsedRequest<any, any>): Promise<ParsedResponse<any>> => {
          const rawRequest = await convertParsedRequestToRaw(req);
          const rawResponse = await endpoint(rawRequest);
          return await convertRawToParsedResponse(rawResponse, output);
        };
      }

      urlHandlers[method] = methodHandlers;
    }

    endpointHandlers[url] = urlHandlers;
  }

  return endpointHandlers;
}

