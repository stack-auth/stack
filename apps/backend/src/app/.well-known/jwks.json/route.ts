import { yupArray, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { getPublicJwkSet } from "@stackframe/stack-shared/dist/utils/jwt";
import { createSmartRouteHandler } from "../../../route-handlers/smart-route-handler";

export const GET = createSmartRouteHandler({
  metadata: {
    summary: "JWKS Endpoint",
    description: "Returns information about the JSON Web Key Set (JWKS) used to sign and verify JWTs.",
    tags: [],
    hidden: true,
  },
  request: yupObject({}),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      keys: yupArray().required(),
    }).required(),
  }),
  async handler() {
    return {
      statusCode: 200,
      bodyType: "json",
      body: await getPublicJwkSet(),
    };
  },
});
