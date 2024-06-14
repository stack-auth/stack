import { currentUserCrudHandlers } from '@/app/api/v1/current-user/crud';
import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { parseOpenAPI } from '@/lib/openapi';
import yaml from 'yaml';
import fs from 'fs';

for (const audience of ['client', 'server'] as const) {
  const openAPISchema = yaml.stringify(parseOpenAPI({
    endpointOptions: [
      {
        handler: usersCrudHandlers.listHandler,
        path: '/users',
        tags: ['Users'],
      },
      {
        handler: usersCrudHandlers,
        path: '/users/{userId}',
        tags: ['Users'],
      },
      {
        handler: currentUserCrudHandlers,
        path: '/current-user',
        tags: ['Users'],
      }
    ],
    audience,
  }));

  fs.writeFileSync(`../../docs/fern/openapi/${audience}.yaml`, openAPISchema);
}