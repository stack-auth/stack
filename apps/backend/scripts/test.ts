import { EndpointsSchema, RawEndpointsHandlers, createEndpointHandlersFromRawEndpoints } from "@/route-handlers/migration-route";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { NextRequest, NextResponse } from "next/server";

const exampleSchema = {
  '/asdf': {
    'GET': {
      'asdf': {
        input: {
          query: yupObject({
            abc: yupString(),
          }),
          body: yupObject({
            def: yupString(),
          }),
        },
        output: {
          statusCode: yupNumber(),
          headers: yupObject({}),
          body: yupObject({}),
        },
      },
    },
  },
} as const satisfies EndpointsSchema;

const exampleRawEndpointHandlers = {
  '/asdf': {
    'GET': async (req: NextRequest) => {
      return NextResponse.json({ 'hi': 'asdf' });
    },
  },
} satisfies RawEndpointsHandlers;

const exampleEndpointHandlers = createEndpointHandlersFromRawEndpoints(exampleRawEndpointHandlers, exampleSchema);

exampleEndpointHandlers['/asdf']['GET']['asdf']({
  url: 'http://localhost:3000/asdf',
  method: 'POST',
  headers: {},
  body: {
    def: 'asdf',
  },
  query: {
    abc: 'asdf',
  },
}).then((res) => {
  console.log(res, '!!!!!!!!!!!!');
}).catch((err) => {
  console.error(err);
});

