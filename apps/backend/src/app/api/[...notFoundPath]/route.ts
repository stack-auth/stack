import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

const handler = createSmartRouteHandler({
  request: yupObject({
    url: yupString().required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([404]).required(),
    bodyType: yupString().oneOf(["text"]).required(),
    body: yupString().required(),
  }),
  handler: async (req, fullReq) => {
    return {
      statusCode: 404,
      bodyType: "text",
      body: `URL not found: ${req.url} (404)`,
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
