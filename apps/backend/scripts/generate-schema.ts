import { listEndpoints } from '@/lib/glob';
import fs from 'fs';
import prettier from 'prettier';

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

main().catch((...args) => {
  console.error(`ERROR! Could not generate schema`, ...args);
  process.exit(1);
});
