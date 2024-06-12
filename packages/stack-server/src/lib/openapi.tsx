import { CrudSchemaCreationOptions, CrudSchemaFromOptions } from '@stackframe/stack-shared/dist/crud';
import * as yup from 'yup';

export function parse<O extends CrudSchemaCreationOptions>(options: {
  schema: CrudSchemaFromOptions<O>,
  pathSchema?: yup.Schema,
  path: string,
}) {
  if (!options.schema.server.readSchema) return;
  // return parseSchema({
  //   pathSchema: options.pathSchema,
  //   parameterSchema: yup.object().meta(options.schema.server.readSchema.describe().meta || {}),
  //   responseSchema: options.schema.server.readSchema,
  //   type: 'get',
  // });
  if (!options.schema.server.updateSchema) return;

  return parseSchema({
    metadata: endpointMetadataSchema.validateSync(options.schema.server.updateSchema.describe().meta),
    pathSchema: options.pathSchema,
    requestBodySchema: options.schema.server.updateSchema,
    responseSchema: options.schema.server.readSchema,
    type: 'put',
  });
}

const endpointMetadataSchema = yup.object({
  summary: yup.string().required(),
  description: yup.string().required(),
  operationId: yup.string().optional(),
});

const fieldMetadataSchema = yup.object({
  description: yup.string().optional(),
  example: yup.mixed().optional(),
  hide: yup.boolean().optional(),
});

function getFieldSchema(field: yup.SchemaFieldDescription): { type: string, items?: any } | null {
  // @ts-ignore
  let schema: any = fieldMetadataSchema.validateSync(field.meta);
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
      // @ts-ignore
      schema = { type: 'array', items: getFieldSchema(field.innerType), ...schema };
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
    throw new Error('Expected object schema');
  }
  const description = schema.describe();
  return Object.entries(description.fields).map(([key, field]) => {
    return {
      name: key,
      in: inType,
      schema: getFieldSchema(field),
      // @ts-ignore
      required: !field.optional && !field.nullable,
    };
  }).filter((x) => x.schema !== null);
}

function toProperties(schema: yup.Schema) {
  if (!(schema instanceof yup.object)) {
    throw new Error('Expected object schema');
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
    throw new Error('Expected object schema');
  }
  const description = schema.describe();
  // @ts-ignore
  return Object.entries(description.fields).filter(([_, field]) => !field.optional && !field.nullable).map(([key]) => key);
}

export function parseSchema(options: {
  metadata: yup.InferType<typeof endpointMetadataSchema>,
  pathSchema?: yup.Schema,
  parameterSchema?: yup.Schema,
  requestBodySchema?: yup.Schema,
  responseSchema: yup.Schema,
  type: 'get' | 'post' | 'put' | 'delete',
}) {
  const pathParameters = options.pathSchema ? toParameters(options.pathSchema, 'path') : [];
  const queryParameters = options.parameterSchema ? toParameters(options.parameterSchema) : [];
  const responseProperties = toProperties(options.responseSchema);

  let requestBody;
  if (options.requestBodySchema) {
    requestBody = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: toProperties(options.requestBodySchema),
            required: toRequired(options.requestBodySchema),
          },
        },
      },
    };
  }

  return {
    [options.type]: {
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
    }
  };
}