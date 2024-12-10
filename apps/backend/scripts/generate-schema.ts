import { listEndpoints } from '@/lib/glob';
import fs from 'fs';
import * as yup from 'yup';
async function main() {
  console.log("Started docs schema generator");

  const endpoints = await listEndpoints("api/v1");
  let schemaContent = '';

  endpoints.forEach((handlersByMethod, url) => {
    handlersByMethod.forEach((handler, method) => {
      console.log(`  ${method}`);

      if (handler.overloads.size === 1) {
        console.log('    overloads: 1');
      } else {
        console.log(`    overloads: ${handler.overloads.size}`);
      }

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

      if (audiences.size === 0) {
        schemaContent += schemaToTypeString(handler.overloads.values().next().value.request.describe());
      } else {
        for (const audience of audiences.values()) {
          schemaContent += schemaToTypeString(audience.request.describe()) + '\n\n';
        }
      }
    });
  });

  fs.writeFileSync('schema.ts', schemaContent);
  console.log(`    Wrote schema to schema.ts`);
}

function schemaToTypeString(schema: yup.SchemaFieldDescription, indent: number = 0): string {
  switch (schema.type) {
    case 'object': {
      return '{\n' + Object.entries((schema as any).fields).map(([key, value]): any => `${'  '.repeat(indent + 1)}${key}: ${schemaToTypeString(value as any, indent + 1)}`).join(',\n') + '\n' + '  '.repeat(indent) + '}';
    }
    case 'array': {
      return `${schemaToTypeString((schema as any).innerType, indent + 1)}[]`;
    }
    case 'tuple': {
      return '[\n' + (schema as any).innerType.map((value: any) => `${'  '.repeat(indent + 1)}${schemaToTypeString(value, indent + 1)}`).join(',\n') + '\n' + '  '.repeat(indent) + ']';
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
