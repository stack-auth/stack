import { listEndpoints } from '@/lib/glob';
import fs from 'fs';
import * as prettier from "prettier";
import * as yup from 'yup';


async function main() {
  console.log("Started docs schema generator");

  const endpoints = await listEndpoints("api/v1");
  let schemaContent = 'type EndpointSchema = {';

  endpoints.forEach((handlersByMethod, url) => {
    let methodContent = '{';

    handlersByMethod.forEach((handler, method) => {
      const audiences = new Map<string, any>();
      for (const overload of handler.overloads.values()) {
        for (const audience of ['client', 'server', 'admin'] as const) {
          const schemaAudience = overload.request.describe().fields.auth?.fields?.type;
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
        endpointContent = '{default: ' + schemaToTypeString(handler.overloads.values().next().value.request.describe()) + '}';
      } else {
        endpointContent = '{' + Array.from(audiences.entries()).map(([audience, overload]) => {
          return `${audience}: {` +
            Object.entries(overload.request.describe().fields)
              .map(([key, value]): any => `${key}: ${schemaToTypeString(value as any)}`)
              .join(',') +
            '}';
        }).join(',') + '}';
      }

      methodContent += `${method}: ${endpointContent},`;
    });

    methodContent += '}';
    schemaContent += `"${url || '/'}": ${methodContent},`;
  });

  schemaContent += '}';

  fs.writeFileSync('schema.ts', await prettier.format(schemaContent, {
    parser: "typescript",
    semi: true,
    singleQuote: true,
    trailingComma: "all",
  }));
  console.log(`    Wrote schema to schema.ts`);
}

function schemaToTypeString(schema: yup.SchemaFieldDescription): string {
  switch (schema.type) {
    case 'object': {
      return '{' + Object.entries((schema as any).fields).map(([key, value]): any => `"${key}": ${schemaToTypeString(value as any)}`).join(',') + '}';
    }
    case 'array': {
      return `${schemaToTypeString((schema as any).innerType)}[]`;
    }
    case 'tuple': {
      return '[' + (schema as any).innerType.map((value: any) => `${schemaToTypeString(value)}`).join(',') + ']';
    }
    case 'mixed': {
      return 'any';
    }
    case 'string': {
      return 'string';
    }
    case 'number': {
      return 'number';
    }
    case 'boolean': {
      return 'boolean';
    }
    default: {
      throw new Error(`Unsupported schema type: ${schema.type}`);
    }
  }
}

main().catch((...args) => {
  console.error(`ERROR! Could not generate schema`, ...args);
  process.exit(1);
});
