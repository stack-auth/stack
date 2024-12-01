import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export const POST = createSmartRouteHandler({
  request: yupObject({
    url: yupString().defined(),
    body: yupObject({
      grant_type: yupString().oneOf(["authorization_code"]).defined(),
      code: yupString().defined(),
      code_verifier: yupString().defined(),
      client_id: yupString().defined(),
      client_secret: yupString().defined(),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      access_token: yupString().defined(),
      token_type: yupString().oneOf(["api_key"]).defined(),
      project_id: yupString().defined(),
    }).defined(),
  }),
  handler: async (req) => {
    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        access_token: "some-api-key",
        token_type: "api_key",
        project_id: "some-project-id",
      },
    };
  },
});
