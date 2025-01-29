import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { SmartRouter } from "@/smart-router";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";

export const GET = createSmartRouteHandler({
  request: yupObject({
    url: yupString().defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["text"]).defined(),
    body: yupString().defined(),
  }),
  handler: async (req, fullReq) => {
    return {
      statusCode: 200,
      bodyType: "text",
      body: deindent`
        Welcome to latest-only! This is available on all API versions.

        URL: ${req.url}
      `,
    };
  },
});
