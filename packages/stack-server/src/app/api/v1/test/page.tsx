import { parse } from '@/lib/openapi';
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import yaml from 'yaml';

export default async function Page() {
  return <textarea style={{ height: '500px', width: '500px' }}>
    {yaml.stringify(parse(usersCrud))}
  </textarea>;
}