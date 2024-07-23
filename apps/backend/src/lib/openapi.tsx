import { SmartRouteHandler } from '@/route-handlers/smart-route-handler';
import { CrudlOperation, EndpointDocumentation } from '@stackframe/stack-shared/dist/crud';
import { StackAssertionError } from '@stackframe/stack-shared/dist/utils/errors';
import { HttpMethod } from '@stackframe/stack-shared/dist/utils/http';
import { typedEntries, typedFromEntries } from '@stackframe/stack-shared/dist/utils/objects';
import { deindent } from '@stackframe/stack-shared/dist/utils/strings';
import * as yup from 'yup';

export function parseOpenAPI(options: {
  endpoints: Map<string, Map<HttpMethod, SmartRouteHandler>>,
  audience: 'client' | 'server' | 'admin',
}) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Stack REST API',
      version: '1.0.0',
    },
    servers: [{
      url: 'https://api.stack-auth.com/api/v1',
      description: 'Stack REST API',
    }],
    paths: Object.fromEntries(
      [...options.endpoints]
        .map(([path, handlersByMethod]) => (
          [path, Object.fromEntries(
            [...handlersByMethod]
              .map(([method, handler]) => (
                [method.toLowerCase(), parseRouteHandler({ handler, method, path, audience: options.audience })]
              ))
              .filter(([_, handler]) => handler !== undefined)
          )]
        ))
        .filter(([_, handlersByMethod]) => Object.keys(handlersByMethod).length > 0),
    ),
  };
}

function undefinedIfMixed(value: yup.SchemaFieldDescription | undefined): yup.SchemaFieldDescription | undefined {
  if (!value) return undefined;
  return value.type === 'mixed' ? undefined : value;
}

function isSchemaObjectDescription(value: yup.SchemaFieldDescription): value is yup.SchemaObjectDescription & { type: 'object' } {
  return value.type === 'object';
}

function isSchemaMixedDescription(value: yup.SchemaFieldDescription): value is yup.SchemaDescription & { type: 'mixed' } {
  return value.type === 'mixed';
}

function isSchemaArrayDescription(value: yup.SchemaFieldDescription): value is yup.SchemaInnerTypeDescription & { type: 'array', innerType: yup.SchemaInnerTypeDescription } {
  return value.type === 'array';
}

function isSchemaTupleDescription(value: yup.SchemaFieldDescription): value is yup.SchemaInnerTypeDescription & { type: 'tuple', innerType: yup.SchemaInnerTypeDescription[] } {
  return value.type === 'tuple';
}

function isMaybeRequestSchemaForAudience(requestDescribe: yup.SchemaObjectDescription, audience: 'client' | 'server' | 'admin') {
  const schemaAuth = requestDescribe.fields.auth;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- yup types are wrong and claim that fields always exist
  if (!schemaAuth) return true;
  if (isSchemaMixedDescription(schemaAuth)) return true;
  if (!isSchemaObjectDescription(schemaAuth)) return true;
  const schemaAudience = schemaAuth.fields.type;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- same as above
  if (!schemaAudience) return true;
  if ("oneOf" in schemaAudience) {
    return schemaAudience.oneOf.includes(audience);
  }
}


function parseRouteHandler(options: {
  handler: SmartRouteHandler,
  path: string,
  method: HttpMethod,
  audience: 'client' | 'server' | 'admin',
}) {
  let result: any = undefined;

  for (const overload of options.handler.overloads.values()) {
    const requestDescribe = overload.request.describe();
    const responseDescribe = overload.response.describe();
    if (!isSchemaObjectDescription(requestDescribe)) throw new Error('Request schema must be a yup.ObjectSchema');
    if (!isSchemaObjectDescription(responseDescribe)) throw new Error('Response schema must be a yup.ObjectSchema');

    // estimate whether this overload is the right one based on a heuristic
    if (!isMaybeRequestSchemaForAudience(requestDescribe, options.audience)) {
      // This overload is definitely not for the audience
      continue;
    }

    if (result) {
      throw new StackAssertionError(deindent`
        OpenAPI generator matched multiple overloads for audience ${options.audience} on endpoint ${options.method} ${options.path}.
        
        This does not necessarily mean there is a bug in the endpoint; the OpenAPI generator uses a heuristic to pick the allowed overloads, and may pick too many. Currently, this heuristic checks whether the request.auth.type property in the schema is a yup.string.oneOf(...) and matches it to the expected audience of the schema. If there are multiple overloads matching a single audience, for example because none of the overloads specify request.auth.type, the OpenAPI generator will not know which overload to generate specs for, and hence fails.
        
        Either specify request.auth.type on the schema of the specified endpoint or update the OpenAPI generator to support your use case. 
      `);
    }

    result = parseOverload({
      metadata: overload.metadata,
      method: options.method,
      path: options.path,
      pathDesc: undefinedIfMixed(requestDescribe.fields.params),
      parameterDesc: undefinedIfMixed(requestDescribe.fields.query),
      requestBodyDesc: undefinedIfMixed(requestDescribe.fields.body),
      responseDesc: undefinedIfMixed(responseDescribe.fields.body),
    });
  }

  return result;
}

function getFieldSchema(field: yup.SchemaFieldDescription, crudOperation?: Capitalize<CrudlOperation>): { type: string, items?: any, properties?: any, required?: any } | null {
  const meta = "meta" in field ? field.meta : {};
  if (meta?.openapiField?.hidden) {
    return null;
  }

  if (meta?.openapiField?.onlyShowInOperations && !meta.openapiField.onlyShowInOperations.includes(crudOperation as any)) {
    return null;
  }

  const openapiFieldExtra = {
    example: meta?.openapiField?.exampleValue,
    description: meta?.openapiField?.description,
  };

  switch (field.type) {
    case 'string':
    case 'number':
    case 'boolean': {
      return { type: field.type, ...openapiFieldExtra };
    }
    case 'mixed': {
      return { type: 'object', ...openapiFieldExtra };
    }
    case 'object': {
      return {
        type: 'object',
        properties: typedFromEntries(typedEntries((field as any).fields)
          .map(([key, field]) => [key, getFieldSchema(field, crudOperation)])),
        required: typedEntries((field as any).fields)
          .filter(([_, field]) => !(field as any).optional && !(field as any).nullable)
          .map(([key]) => key),
        ...openapiFieldExtra
      };
    }
    case 'array': {
      return { type: 'array', items: getFieldSchema((field as any).innerType, crudOperation), ...openapiFieldExtra };
    }
    default: {
      throw new Error(`Unsupported field type: ${field.type}`);
    }
  }
}

function toParameters(description: yup.SchemaFieldDescription, crudOperation?: Capitalize<CrudlOperation>, path?: string) {
  const pathParams: string[] = path ? path.match(/{[^}]+}/g) || [] : [];
  if (!isSchemaObjectDescription(description)) {
    throw new StackAssertionError('Parameters field must be an object schema', { actual: description });
  }

  return Object.entries(description.fields).map(([key, field]) => {
    if (path && !pathParams.includes(`{${key}}`)) {
      return { schema: null };
    }

    const meta = "meta" in field ? field.meta : {};
    return {
      name: key,
      in: path ? 'path' : 'query',
      schema: getFieldSchema(field as any, crudOperation),
      description: meta?.openapiField?.description,
      required: !(field as any).optional && !(field as any).nullable,
    };
  }).filter((x) => x.schema !== null);
}

function toSchema(description: yup.SchemaFieldDescription, crudOperation?: Capitalize<CrudlOperation>): any {
  if (isSchemaObjectDescription(description)) {
    return {
      type: 'object',
      properties: Object.fromEntries(Object.entries(description.fields).map(([key, field]) => {
        return [key, getFieldSchema(field, crudOperation)];
      }, {}))
    };
  } else if (isSchemaArrayDescription(description)) {
    return {
      type: 'array',
      items: toSchema(description.innerType, crudOperation),
    };
  } else {
    throw new StackAssertionError(`Unsupported schema type: ${description.type}`, { actual: description });
  }
}

function toRequired(description: yup.SchemaFieldDescription) {
  let res: string[] = [];
  if (isSchemaObjectDescription(description)) {
    res = Object.entries(description.fields)
      .filter(([_, field]) => !(field as any).optional && !(field as any).nullable)
      .map(([key]) => key);
  } else if (isSchemaArrayDescription(description)) {
    res = [];
  } else {
    throw new StackAssertionError(`Unsupported schema type: ${description.type}`, { actual: description });
  }
  if (res.length === 0) return undefined;
  return res;
}

function toExamples(description: yup.SchemaFieldDescription, crudOperation?: Capitalize<CrudlOperation>) {
  if (!isSchemaObjectDescription(description)) {
    throw new StackAssertionError('Examples field must be an object schema', { actual: description });
  }

  return Object.entries(description.fields).reduce((acc, [key, field]) => {
    const schema = getFieldSchema(field, crudOperation);
    if (!schema) return acc;
    const example = "meta" in field ? field.meta?.openapiField?.exampleValue : undefined;
    return { ...acc, [key]: example };
  }, {});
}

export function parseOverload(options: {
  metadata: EndpointDocumentation | undefined,
  method: string,
  path: string,
  pathDesc?: yup.SchemaFieldDescription,
  parameterDesc?: yup.SchemaFieldDescription,
  requestBodyDesc?: yup.SchemaFieldDescription,
  responseDesc?: yup.SchemaFieldDescription,
}) {
  const endpointDocumentation = options.metadata ?? {
    summary: `${options.method} ${options.path}`,
    description: `No documentation available for this endpoint.`,
  };

  const pathParameters = options.pathDesc ? toParameters(options.pathDesc, endpointDocumentation.crudOperation, options.path) : [];
  const queryParameters = options.parameterDesc ? toParameters(options.parameterDesc, endpointDocumentation.crudOperation) : [];
  const responseSchema = options.responseDesc ? toSchema(options.responseDesc, endpointDocumentation.crudOperation) : {};
  const responseRequired = options.responseDesc ? toRequired(options.responseDesc) : undefined;

  let requestBody;
  if (options.requestBodyDesc) {
    requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            ...toSchema(options.requestBodyDesc, endpointDocumentation.crudOperation),
            required: toRequired(options.requestBodyDesc),
            example: toExamples(options.requestBodyDesc, endpointDocumentation.crudOperation),
          },
        },
      },
    };
  }

  if (endpointDocumentation.hidden) {
    return undefined;
  }

  return {
    summary: endpointDocumentation.summary,
    description: endpointDocumentation.description,
    parameters: queryParameters.concat(pathParameters),
    requestBody,
    tags: endpointDocumentation.tags ?? ["Others"],
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
