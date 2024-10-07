import { yupArray, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { getPerAudienceSecret, getPublicJwkSet } from "@stackframe/stack-shared/dist/utils/jwt";
import { notFound } from "next/navigation";
import { getProject } from "../../../../../../../lib/projects";
import { createSmartRouteHandler } from "../../../../../../../route-handlers/smart-route-handler";

export const GET = createSmartRouteHandler({
  metadata: {
    summary: "JWKS Endpoint",
    description: "Returns information about the JSON Web Key Set (JWKS) used to sign and verify JWTs.",
    tags: [],
    hidden: true,
  },
  request: yupObject({
    params: yupObject({
      project_id: yupString().required(),
    }),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      keys: yupArray().required(),
    }).required(),
  }),
  async handler({ params }) {
    const project = await getProject(params.project_id);

    if (!project) {
      notFound();
    }

    return {
      statusCode: 200,
      bodyType: "json",
      body: await getPublicJwkSet(getPerAudienceSecret({
        audience: params.project_id,
        secret: getEnvVariable("STACK_SERVER_SECRET"),
      })),
    };
  },
});
