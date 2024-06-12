import { parseEndpoint, parseOpenAPI } from '@/lib/openapi';
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import yaml from 'yaml';
import * as yup from 'yup';

export default async function Page() {
  return <textarea 
    style={{ height: '95vh', width: '95vw' }} 
    defaultValue={yaml.stringify(parseOpenAPI({
      endpoints: [{
        schema: usersCrud, 
        path: '/users/{userId}', 
        pathSchema: yup.object({
          userId: yup.string().required().meta({ description: 'The user ID' })
        }) 
      }],
    }))}
  />;
}