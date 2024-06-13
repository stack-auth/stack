import { currentUserCrudHandlers } from '@/app/api/v1/current-user/crud';
import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { parseOpenAPI } from '@/lib/openapi';
import yaml from 'yaml';
import fs from 'fs';

const serverOpenAPI = yaml.stringify(parseOpenAPI({
  endpointOptions: [
    {
      handler: usersCrudHandlers.listHandler,
      path: '/users'
    },
    {
      handler: usersCrudHandlers,
      path: '/users/{userId}',
    },
    {
      handler: currentUserCrudHandlers,
      path: '/current-user',
    }
  ],
  audience: 'server',
}));

const clientOpenAPI = yaml.stringify(parseOpenAPI({
  endpointOptions: [
    {
      handler: currentUserCrudHandlers,
      path: '/current-user',
    }
  ],
  audience: 'client',
}));

fs.writeFileSync('../../docs/fern/openapi/server.yaml', serverOpenAPI);
fs.writeFileSync('../../docs/fern/openapi/client.yaml', clientOpenAPI);