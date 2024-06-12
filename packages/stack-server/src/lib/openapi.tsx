import { CrudSchemaCreationOptions, CrudSchemaFromOptions } from '@stackframe/stack-shared/dist/crud';
import * as yup from 'yup';

export function parse<O extends CrudSchemaCreationOptions>(options: {
  schema: CrudSchemaFromOptions<O>,
  path: string,
}) {
  if (!options.schema.server.readSchema) return;
  return parseSchema({
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
  const common = fieldMetadataSchema.validateSync(field.meta);
  if (common.hide) {
    return null;
  }

  switch (field.type) {
    case 'string':
    case 'number':
    case 'boolean': {
      return { type: field.type, ...common };
    }
    case 'mixed': {
      return { type: 'object', ...common };
    }
    case 'array': {
      // @ts-ignore
      return { type: 'array', items: getFieldSchema(field.innerType), ...common };
    }
    default: {
      throw new Error(`Unsupported field type: ${field.type}`);
    }
  }
}

function toParameters(schema: yup.Schema) {
  if (!(schema instanceof yup.object)) {
    throw new Error('Expected object schema');
  }
  const description = schema.describe();
  return Object.entries(description.fields).map(([key, field]) => {
    return {
      name: key,
      in: 'query',
      schema: getFieldSchema(field)
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

export function parseSchema(options: {
  parameterSchema: yup.Schema,
  responseSchema: yup.Schema,
  type: 'get' | 'post' | 'put' | 'delete',
}) {
  if (!(options.parameterSchema instanceof yup.object)) {
    throw new Error('Expected object schema');
  }
  const description = options.parameterSchema.describe();
  const metadata = endpointMetadataSchema.validateSync(description.meta);

  const inputParameters = toParameters(options.parameterSchema);
  const outputProperties = toProperties(options.responseSchema);

  return {
    [options.type]: {
      summary: metadata.summary,
      description: metadata.description,
      operationId: metadata.operationId,
      parameters: inputParameters,
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: outputProperties,
              },
            },
          },
        },
      },
    }
  };
}