import fs from "fs";
import { glob } from "glob";
import path from "path";
import yaml from "yaml";
import { webhookEvents } from "@stackframe/stack-shared/dist/interface/webhooks";
import { HTTP_METHODS } from "@stackframe/stack-shared/dist/utils/http";
import { parseOpenAPI, parseWebhookOpenAPI } from "@/lib/openapi";
import { isSmartRouteHandler } from "@/route-handlers/smart-route-handler";

async function main() {
  console.log("Started docs schema generator");

  for (const audience of ["client", "server", "admin"] as const) {
    const filePathPrefix = path.resolve(process.platform === "win32" ? "apps/src/app/api/v1" : "src/app/api/v1");
    const importPathPrefix = "@/app/api/v1";
    const filePaths = [...(await glob(filePathPrefix + "/**/route.{js,jsx,ts,tsx}"))];
    const openAPISchema = yaml.stringify(
      parseOpenAPI({
        endpoints: new Map(
          await Promise.all(
            filePaths.map(async (filePath) => {
              if (!filePath.startsWith(filePathPrefix)) {
                throw new Error(`Invalid file path: ${filePath}`);
              }
              const suffix = filePath.slice(filePathPrefix.length);
              const midfix = suffix.slice(0, suffix.lastIndexOf("/route."));
              const importPath = `${importPathPrefix}${suffix}`;
              const urlPath = midfix.replaceAll("[", "{").replaceAll("]", "}");
              const myModule = require(importPath);
              const handlersByMethod = new Map(
                HTTP_METHODS.map((method) => [method, myModule[method]] as const).filter(([_, handler]) => isSmartRouteHandler(handler)),
              );
              return [urlPath, handlersByMethod] as const;
            }),
          ),
        ),
        audience,
      }),
    );
    fs.writeFileSync(`../../docs/fern/openapi/${audience}.yaml`, openAPISchema);

    const webhookOpenAPISchema = yaml.stringify(
      parseWebhookOpenAPI({
        webhooks: webhookEvents,
      }),
    );
    fs.writeFileSync(`../../docs/fern/openapi/webhooks.yaml`, webhookOpenAPISchema);
  }
  console.log("Successfully updated docs schemas");
}
main().catch((...args) => {
  console.error(`ERROR! Could not update OpenAPI schema`, ...args);
  process.exit(1);
});
