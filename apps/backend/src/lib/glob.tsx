import { isSmartRouteHandler } from '@/route-handlers/smart-route-handler';
import { HTTP_METHODS } from '@stackframe/stack-shared/dist/utils/http';
import { typedKeys } from '@stackframe/stack-shared/dist/utils/objects';
import { glob } from 'glob';
import path from 'path';

export async function listEndpoints(basePath: string) {
  const filePathPrefix = path.resolve(process.platform === "win32" ? `apps/src/app/${basePath}` : `src/app/${basePath}`);
  const importPathPrefix = `@/app/${basePath}`;
  const filePaths = [...await glob(filePathPrefix + "/**/route.{js,jsx,ts,tsx}")];

  const endpoints = new Map(await Promise.all(filePaths.map(async (filePath) => {
    if (!filePath.startsWith(filePathPrefix)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }
    const suffix = filePath.slice(filePathPrefix.length);
    const midfix = suffix.slice(0, suffix.lastIndexOf("/route."));
    const importPath = `${importPathPrefix}${suffix}`;
    const urlPath = midfix.replaceAll("[", "{").replaceAll("]", "}");
    const myModule = require(importPath);
    const handlersByMethod = new Map(
      typedKeys(HTTP_METHODS).map(method => [method, myModule[method]] as const)
        .filter(([_, handler]) => isSmartRouteHandler(handler))
    );
    return [urlPath, handlersByMethod] as const;
  })));

  return endpoints;
}
