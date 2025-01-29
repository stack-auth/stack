import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";

export const GET = createSmartRouteHandler({
  request: yupObject({
    url: yupString().defined(),
    query: yupObject({
      l: yupString().defined(),
    }),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["text"]).defined(),
    body: yupString().defined(),
  }),
  handler: async (req) => {
    return {
      statusCode: 200,
      bodyType: "text",
      body: deindent`
        Welcome to breaking-change! This endpoint is available since v1, but has a breaking change in v2beta1. Namely, the query parameter "q" is newly required.

        Value of "q": ${req.query.l}

        URL: ${req.url}
      `,
    };
  },
});
