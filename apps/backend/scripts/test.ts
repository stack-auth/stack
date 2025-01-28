import { EndpointTransforms, EndpointsSchema, ParsedResponseFromSchema, RawEndpointsHandlers, TransformFn, createEndpointHandlersFromRawEndpoints, createMigrationEndpointHandlers } from "@/route-handlers/migration-handler";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { NextRequest, NextResponse } from "next/server";

const schema1 = {
  '/users': {
    'POST': {
      'default': {
        input: {
          query: yupObject({}).defined(),
          body: yupObject({
            fullName: yupString().defined(),
          }).defined(),
        },
        output: {
          statusCode: yupNumber().defined(),
          bodyType: yupString().oneOf(['json']).defined(),
          body: yupObject({
            id: yupString().defined(),
            fullName: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/tokens': {
    'POST': {
      'default': {
        input: {
          query: yupObject({}).defined(),
          body: yupObject({}),
        },
        output: {
          statusCode: yupNumber().defined(),
          bodyType: yupString().oneOf(['json']).defined(),
          body: yupObject({}).defined(),
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
          }).defined(),
          body: yupObject({
            same: yupString().defined(),
          }).defined(),
        },
        output: {
          statusCode: yupNumber().defined(),
          bodyType: yupString().oneOf(['json']),
          body: yupObject({
            same: yupString().defined(),
          }).defined(),
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
          query: yupObject({}).defined(),
          body: yupObject({
            firstName: yupString().defined(),
            lastName: yupString().defined(),
          }).defined(),
        },
        output: {
          statusCode: yupNumber().defined(),
          bodyType: yupString().oneOf(['json']).defined(),
          body: yupObject({
            id: yupString().defined(),
          }).defined(),
        },
      },
    },
    'GET': {
      'default': {
        input: {
          query: yupObject({}).defined(),
          body: yupObject({}).defined(),
        },
        output: {
          statusCode: yupNumber().defined(),
          bodyType: yupString().oneOf(['json']).defined(),
          body: yupObject({}).defined(),
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
          }).defined(),
          body: yupObject({
            same: yupString().defined(),
          }).defined(),
        },
        output: {
          statusCode: yupNumber().defined(),
          bodyType: yupString().oneOf(['json']).defined(),
          body: yupObject({
            same: yupString().defined(),
          }).defined(),
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
          bodyType: 'json',
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
          body: {
            test: 'example-token',
          },
          bodyType: 'json',
        };
      },
    },
  },
  '/same': {
    'POST': {
      'default': async ({ req, newEndpointHandlers }) => {
        return {
          statusCode: 200,
          headers: {},
          body: {
            same: req.body.same,
          },
          bodyType: 'json',
        };
      },
    },
  },
});

type x = EndpointTransforms<typeof schema1, typeof schema2, typeof endpointHandlers1>;

const y = null as unknown as x;

const z = null as unknown as x['/users']['POST']['default'];

type a = Awaited<ReturnType<TransformFn<typeof schema1, typeof endpointHandlers1, '/users', 'POST', 'default'>>>;

type b = ParsedResponseFromSchema<typeof schema1, '/users', 'POST', 'default'>

const c = null as unknown as b;

// endpointHandlers1['/tokens']['POST']['default']({
//   url: 'http://localhost:3000/tokens',
//   method: 'POST',
//   headers: {},
//   body: {},
//   query: {},
// }).then((res) => {
//   console.log(res);
// }).catch((err) => {
//   console.error(err);
// });


endpointHandlers1['/users']['POST']['default']({
  body: {
    fullName: 'John Doe',
  },
  query: {},
  headers: {},
  method: 'POST',
  url: 'http://localhost:3000/users',
}).then((res) => {
  console.log(res);
}).catch((err) => {
  console.error(err);
});
