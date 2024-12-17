import { EndpointTransforms, EndpointsSchema, RawEndpointsHandlers, TransformFn, createEndpointHandlersFromRawEndpoints, createMigrationEndpointHandlers } from "@/route-handlers/migration-handler";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { NextRequest, NextResponse } from "next/server";

const schema1 = {
  '/users': {
    'POST': {
      'default': {
        input: {
          query: yupObject({}),
          body: yupObject({
            fullName: yupString().defined(),
          }),
        },
        output: {
          statusCode: yupNumber(),
          bodyType: yupString().oneOf(['json']),
          body: yupObject({
            id: yupString().defined(),
            fullName: yupString().defined(),
          }),
        },
      },
    },
  },
  '/tokens': {
    'POST': {
      'default': {
        input: {
          query: yupObject({}),
          body: yupObject({}),
        },
        output: {
          statusCode: yupNumber(),
          bodyType: yupString().oneOf(['json']),
          body: yupObject({}),
        },
      },
    },
  },
  '/same': {
    'POST': {
      'default': {
        input: {
          query: yupObject({
            same: yupString().defined(),
          }),
          body: yupObject({
            same: yupString().defined(),
          }),
        },
        output: {
          statusCode: yupNumber(),
          bodyType: yupString().oneOf(['json']),
          body: yupObject({
            same: yupString().defined(),
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
            firstName: yupString().defined(),
            lastName: yupString().defined(),
          }),
        },
        output: {
          statusCode: yupNumber(),
          bodyType: yupString().oneOf(['json']),
          body: yupObject({
            id: yupString().defined(),
          }),
        },
      },
    },
    'GET': {
      'default': {
        input: {
          query: yupObject({}),
          body: yupObject({}),
        },
        output: {
          statusCode: yupNumber(),
          bodyType: yupString().oneOf(['json']),
          body: yupObject({}),
        },
      },
    },
  },
  '/same': {
    'POST': {
      'default': {
        input: {
          query: yupObject({
            same: yupString().defined(),
          }),
          body: yupObject({
            same: yupString().defined(),
          }),
        },
        output: {
          statusCode: yupNumber(),
          bodyType: yupString().oneOf(['json']),
          body: yupObject({
            same: yupString().defined(),
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


const endpointHandlers2 = createEndpointHandlersFromRawEndpoints(exampleRawEndpointHandlers, schema2);
const endpointHandlers1 = createMigrationEndpointHandlers(schema1, schema2, endpointHandlers2, {
  '/users': {
    'POST': {
      'default': async ({ req, newEndpointHandlers }) => {
        const result = await newEndpointHandlers['/users']['POST']['default']({
          body: {
            firstName: req.body.fullName.split(' ')[0],
            lastName: req.body.fullName.split(' ')[1],
          },
          query: {},
          headers: {},
          method: 'POST',
          url: 'http://localhost:3000/users',
        });

        return {
          statusCode: 200,
          headers: {},
          body: {
            id: (result.body as any).id,
            fullName: req.body.fullName,
          },
        };
      },
    },
  },
  '/tokens': {
    'POST': {
      'default': async ({ req, newEndpointHandlers }) => {
        return {
          statusCode: 200,
          headers: {},
          body: {},
        };
      },
    },
  },
});

type x = EndpointTransforms<typeof schema1, typeof schema2, typeof endpointHandlers1>;

const y = null as unknown as x;

const z = null as unknown as x['/users']['POST']['default'];

type a = TransformFn<typeof schema1, typeof endpointHandlers1, '/users', 'POST', 'default'>;


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

