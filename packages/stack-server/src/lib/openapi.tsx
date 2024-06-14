import { CrudHandlers } from '@/route-handlers/crud-handler';
import { RouteHandler } from '@/route-handlers/smart-route-handler';
import { randomInt } from 'crypto';
import * as yup from 'yup';

function isRouteHandler(handlers: any): handlers is CrudHandlers<any> {
  return handlers.schemas !== undefined;
}

function crudHandlerToArray(crudHandler: any) {
  return [
    crudHandler.createHandler,
    crudHandler.readHandler,
    crudHandler.updateHandler,
    crudHandler.deleteHandler,
  ].filter(x => x && x.schemas.size > 0);
}

type EndpointOption = {
  handler: RouteHandler | CrudHandlers<any>,
  path: string,
  tags?: string[],
};

export function parseOpenAPI(options: {
  endpointOptions: EndpointOption[],
  audience: 'client' | 'server' | 'admin',
}) {
  let result: any = {
    openapi: '3.1.0',
    info: {
      title: 'Stack API',
      version: '1.0.0',
    },
    servers: [{
      url: 'https://app.stack-auth.com/api/v1',
      description: 'Stack API server',
    }],
    paths: {},
  };

  for (const endpoint of options.endpointOptions) {

    const handlers = isRouteHandler(endpoint.handler) ? [endpoint.handler] : crudHandlerToArray(endpoint.handler);
    for (const handler of handlers) {
      const parsed = parseRouteHandler({ handler, audience: options.audience, tags: endpoint.tags });
      result.paths[endpoint.path] = { ...result.paths[endpoint.path], ...parsed };
    }
  }

  return result;
}

const endpointMetadataSchema = yup.object({
  summary: yup.string().required(),
  description: yup.string().required(),
  operationId: yup.string().optional(),
  hide: yup.boolean().optional(),
});

const fieldMetadataSchema = yup.object({
  description: yup.string().optional(),
  example: yup.mixed().optional(),
  hide: yup.boolean().optional(),
});

function undefinedIfMixed(value: yup.SchemaDescription | undefined): yup.SchemaDescription | undefined {
  if (!value) return undefined;
  return value.type === 'mixed' ? undefined : value;
}

function parseRouteHandler(options: {
  handler: RouteHandler,
  audience: 'client' | 'server' | 'admin',
  tags?: string[],
}) {
  let schema = options.handler.schemas.get(options.audience);
  if (!schema) return {};

  // const metadata = endpointMetadataSchema.validateSync(serverSchema.request.describe().meta);
  if (!schema.metadata) throw new Error('Missing metadata');

  let result: any = {};
  const requestFields = (schema.request.describe() as any).fields;
  const responseFields = (schema.response.describe() as any).fields;

  for (const method of requestFields.method.oneOf) {
    result[method.toLowerCase()] = {
      ...parseSchema({
        metadata: schema.metadata,
        pathDesc: undefinedIfMixed(requestFields.params),
        parameterDesc: undefinedIfMixed(requestFields.query),
        requestBodyDesc: undefinedIfMixed(requestFields.body),
        responseDesc: undefinedIfMixed(responseFields.body),
      }),
      tags: options.tags,
    };
  }
  return result;
}

function getFieldSchema(field: yup.SchemaFieldDescription): { type: string, items?: any } | null {
  let schema: any = fieldMetadataSchema.validateSync((field as any).meta);
  if (schema.hide) {
    return null;
  }
  
  switch (field.type) {
    case 'string':
    case 'number':
    case 'boolean': {
      schema = { type: field.type, ...schema };
      break;
    }
    case 'mixed': {
      schema = { type: 'object', ...schema };
      break;
    }
    case 'object': {
      schema = { type: 'object', ...schema };
      break;
    }
    case 'array': {
      schema = { type: 'array', items: getFieldSchema((field as any).innerType), ...schema };
      break;
    }
    default: {
      throw new Error(`Unsupported field type: ${field.type}`);
    }
  }

  return schema;
}

function toParameters(description: yup.SchemaDescription, inType: 'query' | 'path' = 'query') {
  return Object.entries((description as any).fields).map(([key, field]) => {
    return {
      name: key,
      in: inType,
      schema: getFieldSchema(field as any),
      required: !(field as any).optional && !(field as any).nullable,
    };
  }).filter((x) => x.schema !== null);
}

function toSchema(description: yup.SchemaDescription): any {
  switch (description.type) {
    case 'object': {
      return {
        type: 'object',
        properties: Object.entries((description as any).fields).reduce((acc, [key, field]) => {
          const schema = getFieldSchema(field as any);
          if (!schema) return acc;
          return { ...acc, [key]: schema };
        }, {})
      };
    }
    case 'array': {
      return {
        type: 'array',
        items: toSchema((description as any).innerType),
      };
    }
    default: {
      throw new Error(`Unsupported description type: ${description.type}`);
    }
  }
}

function toRequired(description: yup.SchemaDescription) {
  switch (description.type) {
    case 'object': {
      return Object.entries((description as any).fields)
        .filter(([_, field]) => !(field as any).optional && !(field as any).nullable)
        .map(([key]) => key);
    }
    case 'array': {
      return [];
    }
  }
}

function toExamples(description: yup.SchemaDescription) {
  return Object.entries((description as any).fields).reduce((acc, [key, field]) => {
    const schema = getFieldSchema(field as any);
    if (!schema) return acc;
    const example = (field as any).meta.example;
    return { ...acc, [key]: schema.type === 'object' ? example: { example } };
  }, {});
}

export function parseSchema(options: {
  metadata: yup.InferType<typeof endpointMetadataSchema>,
  pathDesc?: yup.SchemaDescription,
  parameterDesc?: yup.SchemaDescription,
  requestBodyDesc?: yup.SchemaDescription,
  responseDesc?: yup.SchemaDescription,
}) {
  const pathParameters = options.pathDesc ? toParameters(options.pathDesc, 'path') : [];
  const queryParameters = options.parameterDesc ? toParameters(options.parameterDesc) : [];
  const responseSchema = options.responseDesc ? toSchema(options.responseDesc) : {};
  const responseRequired = options.responseDesc ? toRequired(options.responseDesc) : [];

  let requestBody;
  if (options.requestBodyDesc) {
    requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            ...toSchema(options.requestBodyDesc),
            required: toRequired(options.requestBodyDesc),
            example: toExamples(options.requestBodyDesc),
          },
        },
      },
    };
  }

  return {
    summary: options.metadata.summary,
    description: options.metadata.description,
    operationId: options.metadata.operationId,
    parameters: queryParameters.concat(pathParameters),
    requestBody,
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              ...responseSchema,
              required: responseRequired,
            },
          },
        },
      },
    },
  };
}