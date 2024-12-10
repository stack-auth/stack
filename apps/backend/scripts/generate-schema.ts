import { listEndpoints } from '@/lib/glob';
import fs from 'fs';
import * as prettier from "prettier";
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
  let schemaContent = 'export type EndpointSchema = {';

  endpoints.forEach((handlersByMethod, url) => {
    schemaContent += `"${url || '/'}": {${Array.from(handlersByMethod.keys()).map(method => `${method}: true`).join(',')}},`;
  });

  schemaContent += '}';
  // ========================================

  // ========== generate imports.ts ==========
  let importHeaders = '';
  let importBody = 'export const endpoints = {';

  endpoints.forEach((handlersByMethod, url) => {
    let methodBody = '';
    for (const method of handlersByMethod.keys()) {
      importHeaders += `import { ${method} as ${convertUrlToJSVariable(url, method)} } from "../..${url}";\n`;
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

  fs.writeFileSync('schema.ts', await prettier.format(schemaContent, prettierConfig));
  fs.writeFileSync('imports.ts', await prettier.format(importHeaders + '\n' + importBody, prettierConfig));
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
