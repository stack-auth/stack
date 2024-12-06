import { isSmartRouteHandler } from '@/route-handlers/smart-route-handler';
import { HTTP_METHODS } from '@stackframe/stack-shared/dist/utils/http';
import { glob } from 'glob';
import path from 'path';

export async function listEndpoints(basePath: string) {
  const filePathPrefix = path.resolve(process.platform === "win32" ? `apps/src/app/${basePath}` : `src/app/${basePath}`);
  const importPathPrefix = `@/app/${basePath}`;
  const filePaths = [...await glob(filePathPrefix + "/**/route.{js,jsx,ts,tsx}")];

  const endpoints = new Map(
    filePaths.map((filePath) => {
      if (!filePath.startsWith(filePathPrefix)) {
        throw new Error(`Invalid file path: ${filePath}`);
      }
      const suffix = filePath.slice(filePathPrefix.length);
      const url = suffix.slice(0, suffix.lastIndexOf("/route."));
      const importPath = `${importPathPrefix}${suffix}`;
      const myModule = require(importPath);
      const handlersByMethod = new Map(
        HTTP_METHODS.map(method => [method, myModule[method]] as const)
          .filter(([_, handler]) => isSmartRouteHandler(handler))
      );
      return [url, handlersByMethod] as const;
    }).filter((x) => x[1].size > 0)
  );

  return endpoints;
}
