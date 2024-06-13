import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { parseOpenAPI } from '@/lib/openapi';
import yaml from 'yaml';
import * as yup from 'yup';

console.log(yaml.stringify(parseOpenAPI({
  endpointOptions: [{
    handler: usersCrudHandlers,
    path: '/users/{userId}',
    pathSchema: yup.object({
      userId: yup.string().required().meta({ description: 'The user ID' })
    }),
  }],
})));

// console.log(usersCrudHandlers.readHandler.schemas.get('server')?.request?.describe().fields)