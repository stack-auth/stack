import { CrudSchemaCreationOptions, CrudSchemaFromOptions } from '@stackframe/stack-shared/dist/crud';
import * as yup from 'yup';

export function parse<O extends CrudSchemaCreationOptions>(options: {
  schema: CrudSchemaFromOptions<O>,
  pathSchema?: yup.Schema,
  path: string,
}) {
  if (!options.schema.server.readSchema) return;
  return parseSchema({
    pathSchema: options.pathSchema,
    parameterSchema: yup.object().meta(options.schema.server.readSchema.describe().meta || {}),
    responseSchema: options.schema.server.readSchema,
    type: 'get',
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
  pathSchema?: yup.Schema,
  parameterSchema: yup.Schema,
  responseSchema: yup.Schema,
  type: 'get' | 'post' | 'put' | 'delete',
}) {
  if (!(options.parameterSchema instanceof yup.object)) {
    throw new Error('Expected object schema');
  }
  const description = options.parameterSchema.describe();
  const metadata = endpointMetadataSchema.validateSync(description.meta);

  const pathParameters = options.pathSchema ? toParameters(options.pathSchema, 'path') : [];
  const inputParameters = toParameters(options.parameterSchema);
  const outputProperties = toProperties(options.responseSchema);

  return {
    [options.type]: {
      summary: metadata.summary,
      description: metadata.description,
      operationId: metadata.operationId,
      parameters: inputParameters.concat(pathParameters),
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: outputProperties,
                required: toRequired(options.responseSchema),
              },
            },
          },
        },
      },
    }
  };
}