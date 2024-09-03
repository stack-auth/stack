import { yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";

// TODO: Deprecated route, remove together with the v1 dashboard endpoints
export const POST = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    body: yupObject({
      scope: yupString().optional(),
    }).required(),
    params: yupObject({
      provider_id: yupString().required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupMixed().required(),
  }),
  handler: async ({ params, body }, fullReq) => {
    const response = await fetch(
      `${getEnvVariable("NEXT_PUBLIC_STACK_BACKEND_URL")}/api/v1/connected-accounts/me/${params.provider_id}/access-token`,
      {
        method: "POST",
        headers: Object.fromEntries(Object.entries(fullReq.headers).map(([key, value]) => [key, value?.[0] || ""])),
        body: JSON.stringify(body),
      },
    );

    return {
      statusCode: response.status,
      bodyType: "json",
      body: await response.json(),
    };
  },
});
