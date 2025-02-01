import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
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
      statusCode: 404,
      bodyType: "text",
      body: deindent`
        This endpoint is only available on latest onwards.

        URL: ${req.url}
      `,
    };
  },
});
