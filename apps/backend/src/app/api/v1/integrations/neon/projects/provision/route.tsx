import { createApiKeySet } from "@/lib/api-keys";
import { createProject } from "@/lib/projects";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { neonAuthorizationHeaderSchema, projectDisplayNameSchema, yupNumber, yupObject, yupString, yupTuple } from "@stackframe/stack-shared/dist/schema-fields";
import { decodeBasicAuthorizationHeader } from "@stackframe/stack-shared/dist/utils/http";

export const POST = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    body: yupObject({
      display_name: projectDisplayNameSchema.defined(),
    }).defined(),
    headers: yupObject({
      authorization: yupTuple([neonAuthorizationHeaderSchema.defined()]).defined(),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      project_id: yupString().defined(),
      super_secret_admin_key: yupString().defined(),
    }).defined(),
  }),
  handler: async (req) => {
    const [clientId] = decodeBasicAuthorizationHeader(req.headers.authorization[0])!;

    const createdProject = await createProject([], {
      display_name: req.body.display_name,
      description: "Created with Neon",
    });

    await prismaClient.neonProvisionedProject.create({
      data: {
        projectId: createdProject.id,
        neonClientId: clientId,
      },
    });

    const set = await createApiKeySet({
      projectId: createdProject.id,
      description: "Auto-generated for Neon",
      expires_at_millis: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100).getTime(),
      has_publishable_client_key: false,
      has_secret_server_key: false,
      has_super_secret_admin_key: true,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        project_id: createdProject.id,
        super_secret_admin_key: set.super_secret_admin_key!,
      },
    };
  },
});
