import { EndpointsSchema, RawEndpointsHandlers, createEndpointHandlersFromRawEndpoints, createMigrationEndpointHandlers } from "@/route-handlers/migration-handler";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { NextRequest, NextResponse } from "next/server";

const schema1 = {
  '/users': {
    'POST': {
      'default': {
        input: {
          query: yupObject({}),
          body: yupObject({
            fullName: yupString(),
          }),
        },
        output: {
          statusCode: yupNumber(),
          headers: yupObject({}),
          body: yupObject({
            fullName: yupString(),
          }),
        },
      },
    },
  },
} as const satisfies EndpointsSchema;


const schema2 = {
  '/users': {
    'POST': {
      'default': {
        input: {
          query: yupObject({}),
          body: yupObject({
            firstName: yupString(),
            lastName: yupString(),
          }),
        },
        output: {
          statusCode: yupNumber(),
          headers: yupObject({}),
          body: yupObject({
            id: yupString(),
          }),
        },
      },
    },
  },
} as const satisfies EndpointsSchema;

const exampleRawEndpointHandlers = {
  '/users': {
    'POST': async (req: NextRequest) => {
      return NextResponse.json({ id: 'example-id' });
    },
  },
} satisfies RawEndpointsHandlers;

const endpointHandlers1 = createEndpointHandlersFromRawEndpoints(exampleRawEndpointHandlers, schema1);
const endpointHandlers2 = createMigrationEndpointHandlers(schema1, schema2, endpointHandlers1, {
  '/users': {
    'POST': {
      default: (options) => {
        return endpointHandlers1['/users']['POST']['default'](options);
      },
    },
  },
});


endpointHandlers1['/users']['POST']['default']({
  url: 'http://localhost:3000/users',
  method: 'POST',
  headers: {},
  body: {
    fullName: 'Full Name',
  },
  query: {},
}).then((res) => {
  console.log(res);
}).catch((err) => {
  console.error(err);
});

