import { listEndpoints } from '@/lib/glob';
import { parseOpenAPI, parseWebhookOpenAPI } from '@/lib/openapi';
import { webhookEvents } from '@stackframe/stack-shared/dist/interface/webhooks';
import fs from 'fs';
import yaml from 'yaml';

async function main() {
  console.log("Started docs schema generator");

  for (const audience of ['client', 'server', 'admin'] as const) {
    const openAPISchema = yaml.stringify(parseOpenAPI({
      endpoints: await listEndpoints("api/v1", true, true),
      audience,
    }));
    fs.writeFileSync(`../../docs/fern/openapi/${audience}.yaml`, openAPISchema);

    const webhookOpenAPISchema = yaml.stringify(parseWebhookOpenAPI({
      webhooks: webhookEvents,
    }));
    fs.writeFileSync(`../../docs/fern/openapi/webhooks.yaml`, webhookOpenAPISchema);
  }
  console.log("Successfully updated docs schemas");
}
main().catch((...args) => {
  console.error(`ERROR! Could not update OpenAPI schema`, ...args);
  process.exit(1);
});
