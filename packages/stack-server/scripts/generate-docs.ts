import { usersCrudHandlers } from '@/app/api/v1/users/crud';
import { parseOpenAPI } from '@/lib/openapi';
import yaml from 'yaml';
import * as yup from 'yup';

function crudHandlerToArray(crudHandler: any) {
  return [
    crudHandler.createHandler,
    crudHandler.readHandler,
    crudHandler.updateHandler,
    crudHandler.deleteHandler,
  ].filter(x => x.schemas.size > 0);
}

console.log(yaml.stringify(parseOpenAPI({
  endpointOptions: [{
    handlers: crudHandlerToArray(usersCrudHandlers),
    path: '/users/{userId}',
    pathSchema: yup.object({
      userId: yup.string().required().meta({ description: 'The user ID' })
    }),
  }],
})));

// console.log(usersCrudHandlers.readHandler.schemas.get('server')?.request?.describe().fields)