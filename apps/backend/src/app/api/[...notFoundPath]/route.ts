import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";

const handler = createSmartRouteHandler({
  request: yupObject({
    url: yupString().defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([404]).defined(),
    bodyType: yupString().oneOf(["text"]).defined(),
    body: yupString().defined(),
  }),
  handler: async (req, fullReq) => {
    return {
      statusCode: 404,
      bodyType: "text",
      body: deindent`
        404 — this page does not exist in Stack Auth's API.
        
        Did you mean to visit https://app.stack-auth.com?

        URL: ${req.url}
      `,
    };
  },
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
export const HEAD = handler;
