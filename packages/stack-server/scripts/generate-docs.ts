import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { parseOpenAPI } from '@/lib/openapi';
import yaml from 'yaml';
import * as yup from 'yup';

console.log(yaml.stringify(parseOpenAPI({
  endpointOptions: [
    {
      handler: usersCrudHandlers.listHandler,
      path: '/users'
    },
    {
      handler: usersCrudHandlers,
      path: '/users/{userId}',
    }
  ],
})));

// console.log(usersCrudHandlers.readHandler.schemas.get('server')?.request?.describe().fields)