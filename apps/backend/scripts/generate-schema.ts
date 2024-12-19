import { listEndpoints } from '@/lib/glob';
import { isSmartRouteHandler } from '@/route-handlers/smart-route-handler';
import fs from 'fs';
import prettier from 'prettier';
import * as yup from 'yup';

function convertUrlToJSVariable(url: string, method: string) {
  return 'i' + url.replaceAll('[', '')
    .replaceAll(']', '')
    .replaceAll('.', '')
    .replaceAll('/', '_')
    .replaceAll('-', '_')
    .replace(/_[a-z]/g, match => match[1].toUpperCase())
    .replace(/^[a-z]/, match => match.toUpperCase())
    + method.slice(0, 1).toUpperCase() + method.slice(1).toLowerCase();
}

async function main() {
  console.log("Started docs schema generator");

  const endpoints = await listEndpoints("api/v1", false);

  // ========== generate schema.ts ==========
  let schemaContent = 'import { yupObject, yupArray, yupString, yupNumber, yupBoolean, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";\n\n';
  schemaContent += 'export const endpointSchema = {';

  endpoints.forEach((handlersByMethod, url) => {
    let methodContent = '{';

    handlersByMethod.forEach((handler, method) => {
      if (!isSmartRouteHandler(handler)) {
        // TODO: handle non-smart route handlers
        console.warn(`Skipping non-smart route handler: ${url} ${method}`);
        return;
      }

      const audiences = new Map<string, any>();
      for (const overload of handler.overloads.values()) {
        for (const audience of ['client', 'server', 'admin'] as const) {
          const schemaAudience = (overload.request.describe() as any).fields.auth?.fields?.type;
          if (!schemaAudience) continue;
          if ("oneOf" in schemaAudience && schemaAudience.oneOf.length > 0 && schemaAudience.oneOf.includes(audience)) {
            audiences.set(audience, overload);
          }
        }
      }

      if (handler.overloads.size !== 1 && audiences.size !== handler.overloads.size) {
        throw new Error(`Expected ${handler.overloads.size} audiences, got ${audiences.size}. Multiple audiences other than client, server, and admin is currently not supported. You might need to manually fix this.`);
      }

      let endpointContent;
      if (audiences.size === 0) {
        endpointContent = '{default: ' + endpointSchemaToTypeString(
          handler.overloads.values().next().value.request.describe(),
          handler.overloads.values().next().value.response.describe()
        ) + '}';
      } else {
        endpointContent = '{' + Array.from(audiences.entries()).map(([audience, overload]) => {
          return `${audience}: ${endpointSchemaToTypeString(overload.request.describe(), overload.response.describe())}`;
        }).join(',') + '}';
      }

      methodContent += `${method}: ${endpointContent},`;
    });

    methodContent += '}';
    schemaContent += `"${url || '/'}": ${methodContent},`;
  });

  schemaContent += '}';

  // ========== generate imports.ts ==========
  let importHeaders = '';
  let importBody = 'export const endpoints = {';

  endpoints.forEach((handlersByMethod, url) => {
    let methodBody = '';
    for (const method of handlersByMethod.keys()) {
      importHeaders += `import { ${method} as ${convertUrlToJSVariable(url, method)} } from "../../api/v1${url}/route";\n`;
      methodBody += `"${method}": ${convertUrlToJSVariable(url, method)},`;
    }
    importBody += `"${url || '/'}": {${methodBody}},\n`;
  });

  importBody += '}';
  // ========================================

  const prettierConfig = {
    parser: "typescript",
    semi: true,
    singleQuote: true,
    trailingComma: "all",
  } as const;

  fs.writeFileSync('src/app/api/v2/schema.ts', await prettier.format(schemaContent, prettierConfig));
  fs.writeFileSync('src/app/api/v2/imports.ts', await prettier.format(importHeaders + '\n' + importBody, prettierConfig));
}

function endpointSchemaToTypeString(reqSchema: yup.SchemaFieldDescription, resSchema: yup.SchemaFieldDescription): string {
  if (reqSchema.type !== 'object') {
    throw new Error(`Unsupported schema type: ${reqSchema.type}`);
  }
  let inputFields = "{";
  for (const key of ['body', 'query', 'params']) {
    const field = Object.entries((reqSchema as any).fields).find(([k]) => k === key);
    if (field && Object.keys((field[1] as any).fields || {}).length > 0) {
      inputFields += `${key}: ${schemaToTypeString(field[1] as any)},`;
    }
  }
  inputFields += "}";

  let outputFields = "{";
  const rawOutputFields = (resSchema as any).fields;
  if (rawOutputFields) {
    for (const key of ['statusCode', 'bodyType', 'headers', 'body']) {
      const field = Object.entries(rawOutputFields).find(([k]) => k === key);
      if (field) {
        if (key === 'statusCode') {
          outputFields += `statusCode: [${(field[1] as any).oneOf.join(',')}],`;
        } else if (key === 'bodyType') {
          const bodyType = (field[1] as any).oneOf;
          if (bodyType.length !== 1) {
            throw new Error(`Unsupported body type: ${bodyType}`);
          }
          outputFields += `bodyType: "${bodyType[0]}",`;
        } else {
          outputFields += `${key}: ${schemaToTypeString(field[1] as any)},`;
        }
      }
    }
  }
  outputFields += "}";

  return `{ 
    input: ${inputFields},
    output: ${outputFields},
  }`;
}

function schemaToTypeString(schema: yup.SchemaFieldDescription): string {
  let result;
  switch (schema.type) {
    case 'object': {
      result = `yupObject({${Object.entries((schema as any).fields).map(([key, value]): any => `"${key}": ${schemaToTypeString(value as any)}`).join(',')}})`;
      break;
    }
    case 'array': {
      result = `yupArray(${schemaToTypeString((schema as any).innerType)})`;
      break;
    }
    case 'tuple': {
      result = `yupTuple([${(schema as any).innerType.map((value: any) => schemaToTypeString(value)).join(',')}])`;
      break;
    }
    case 'mixed': {
      result = 'yupMixed()';
      break;
    }
    case 'string': {
      result = 'yupString()';
      break;
    }
    case 'number': {
      result = 'yupNumber()';
      break;
    }
    case 'boolean': {
      result = 'yupBoolean()';
      break;
    }
    default: {
      throw new Error(`Unsupported schema type: ${schema.type}`);
    }
  }

  const optional = (schema as any).optional;
  const nullable = (schema as any).nullable;

  if (!optional && !nullable) {
    result += '.defined()';
  }

  if (optional) {
    result += '.optional()';
  }

  if (nullable) {
    result += '.nullable()';
  }

  if ((schema as any).oneOf && (schema as any).oneOf.length > 0 && (schema as any).oneOf.every((value: any) => value !== undefined)) {
    result += `.oneOf([${(schema as any).oneOf
      .map((value: any) => {
        if (typeof value === 'string') {
          return `"${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        } else if (typeof value === 'number') {
          return value.toString();
        } else {
          throw new Error(`Unsupported oneOf value: ${value}`);
        }
      })
      .join(',')}])`;
  }

  return result;
}

main().catch((...args) => {
  console.error(`ERROR! Could not generate schema`, ...args);
  process.exit(1);
});
