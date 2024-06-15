import { currentUserCrudHandlers } from '@/app/api/v1/current-user/crud';
import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { parseOpenAPI } from '@/lib/openapi';
import yaml from 'yaml';
import fs from 'fs';

const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];

for (const audience of ['client', 'server'] as const) {
  const openAPISchema = yaml.stringify(parseOpenAPI({
    endpointOptions: [
      {
        handlers: [usersCrudHandlers.listHandler],
        path: '/users',
        tags: ['Users'],
      },
      {
        handlers: [
          usersCrudHandlers.readHandler,
          usersCrudHandlers.updateHandler,
          usersCrudHandlers.deleteHandler,
        ],
        path: '/users/{userId}',
        tags: ['Users'],
      },
      {
        handlers: [
          currentUserCrudHandlers.readHandler,
          currentUserCrudHandlers.updateHandler,
        ],
        path: '/current-user',
        tags: ['Users'],
      }
    ],
    audience,
  }));

  fs.writeFileSync(`../../docs/fern/openapi/${audience}.yaml`, openAPISchema);

  console.log("Successfully updated OpenAPI schema");
}
