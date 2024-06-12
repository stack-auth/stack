import { CrudSchemaCreationOptions, CrudSchemaFromOptions } from '@stackframe/stack-shared/dist/crud';
import * as yup from 'yup';

type endpointOptions<O extends CrudSchemaCreationOptions> = {
  schema: CrudSchemaFromOptions<O>,
  pathSchema?: yup.Schema,
  path: string,
};


export function parseOpenAPI(options: {
  endpoints: endpointOptions<any>[],
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

  for (const endpoint of options.endpoints) {
    const parsed = parseEndpoint(endpoint);
    result.paths = { ...result.paths, ...parsed };
  }

  return result;
}

function parseEndpoint<O extends CrudSchemaCreationOptions>(options: endpointOptions<O>) {
  const serverSchema = options.schema.server;
  
  let result: any = {};
  if (!serverSchema.readSchema) throw new Error('Missing read schema');

  if (serverSchema.createSchema) {
    const createMetadata = endpointMetadataSchema.validateSync(serverSchema.createSchema.describe().meta);
    result.post = parseSchema({
      metadata: createMetadata,
      pathSchema: options.pathSchema,
      requestBodySchema: serverSchema.createSchema,
      responseSchema: serverSchema.readSchema,
    });
  }

  const readMetadata = endpointMetadataSchema.validateSync(serverSchema.readSchema.describe().meta);
  if (!readMetadata.hide) {
    result.get = parseSchema({
      metadata: readMetadata,
      pathSchema: options.pathSchema,
      parameterSchema: yup.object().meta(readMetadata),
      responseSchema: serverSchema.readSchema,
    });
  }

  if (serverSchema.updateSchema) {
    const updateMetadata = endpointMetadataSchema.validateSync(serverSchema.updateSchema.describe().meta);
    result.put = parseSchema({
      metadata: updateMetadata,
      pathSchema: options.pathSchema,
      requestBodySchema: serverSchema.updateSchema,
      responseSchema: serverSchema.readSchema,
    });
  }

  if (serverSchema.deleteSchema) {
    const deleteMetadata = endpointMetadataSchema.validateSync(serverSchema.deleteSchema.describe().meta);
    result.delete = parseSchema({
      metadata: deleteMetadata,
      pathSchema: options.pathSchema,
      parameterSchema: serverSchema.deleteSchema,
      responseSchema: serverSchema.readSchema,
    });
  }

  return {
    [options.path]: result,
  };
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

function toParameters(schema: yup.Schema, inType: 'query' | 'path' = 'query') {
  if (!(schema instanceof yup.object)) {
    return [];
  }
  const description = schema.describe();
  return Object.entries(description.fields).map(([key, field]) => {
    return {
      name: key,
      in: inType,
      schema: getFieldSchema(field),
      required: !(field as any).optional && !(field as any).nullable,
    };
  }).filter((x) => x.schema !== null);
}

function toProperties(schema: yup.Schema) {
  if (!(schema instanceof yup.object)) {
    return {};
  }
  const description = schema.describe();
  return Object.entries(description.fields).reduce((acc, [key, field]) => {
    const schema = getFieldSchema(field);
    if (!schema) return acc;
    return { ...acc, [key]: schema };
  }, {});
}

function toRequired(schema: yup.Schema) {
  if (!(schema instanceof yup.object)) {
    return [];
  }
  const description = schema.describe();
  return Object.entries(description.fields)
    .filter(([_, field]) => !(field as any).optional && !(field as any).nullable)
    .map(([key]) => key);
}

function toExamples(schema: yup.Schema) {
  if (!(schema instanceof yup.object)) {
    return {};
  }
  const description = schema.describe();
  return Object.entries(description.fields).reduce((acc, [key, field]) => {
    const schema = getFieldSchema(field);
    if (!schema) return acc;
    const example = (field as any).meta.example;
    return { ...acc, [key]: schema.type === 'object' ? example: { example } };
  }, {});
}

export function parseSchema(options: {
  metadata: yup.InferType<typeof endpointMetadataSchema>,
  pathSchema?: yup.Schema,
  parameterSchema?: yup.Schema,
  requestBodySchema?: yup.Schema,
  responseSchema: yup.Schema,
}) {
  const pathParameters = options.pathSchema ? toParameters(options.pathSchema, 'path') : [];
  const queryParameters = options.parameterSchema ? toParameters(options.parameterSchema) : [];
  const responseProperties = toProperties(options.responseSchema);

  let requestBody;
  if (options.requestBodySchema) {
    requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: toProperties(options.requestBodySchema),
            required: toRequired(options.requestBodySchema),
            example: toExamples(options.requestBodySchema),
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
              type: 'object',
              properties: responseProperties,
              required: toRequired(options.responseSchema),
            },
          },
        },
      },
    },
  };
}