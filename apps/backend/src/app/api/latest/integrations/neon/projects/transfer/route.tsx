import { getProject } from "@/lib/projects";
import { getSoleTenancyFromProject } from "@/lib/tenancies";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { neonAuthorizationHeaderSchema, urlSchema, yupNumber, yupObject, yupString, yupTuple } from "@stackframe/stack-shared/dist/schema-fields";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { decodeBasicAuthorizationHeader } from "@stackframe/stack-shared/dist/utils/http";
import { neonIntegrationProjectTransferCodeHandler } from "./confirm/verification-code-handler";

async function validateAndGetTransferInfo(authorizationHeader: string, projectId: string) {
  const [clientId, clientSecret] = decodeBasicAuthorizationHeader(authorizationHeader)!;
  const internalProject = await getProject("internal") ?? throwErr("Internal project not found");

  const neonProvisionedProject = await prismaClient.neonProvisionedProject.findUnique({
    where: {
      projectId,
      neonClientId: clientId,
    },
  });
  if (!neonProvisionedProject) {
    throw new StatusError(400, "This project either doesn't exist or the current Neon client is not authorized to transfer it. Note that projects can only be transferred once.");
  }

  return {
    neonProvisionedProject,
    internalProject,
  };
}


export const GET = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    query: yupObject({
      project_id: yupString().defined(),
    }).defined(),
    headers: yupObject({
      authorization: yupTuple([neonAuthorizationHeaderSchema.defined()]).defined(),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      message: yupString().defined(),
    }).defined(),
  }),
  handler: async (req) => {
    await validateAndGetTransferInfo(req.headers.authorization[0], req.query.project_id);

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        message: "Ready to transfer project; please use the POST method to initiate it.",
      },
    };
  },
});

export const POST = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    body: yupObject({
      project_id: yupString().defined(),
    }).defined(),
    headers: yupObject({
      authorization: yupTuple([neonAuthorizationHeaderSchema.defined()]).defined(),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      confirmation_url: urlSchema.defined(),
    }).defined(),
  }),
  handler: async (req) => {
    const { neonProvisionedProject, internalProject } = await validateAndGetTransferInfo(req.headers.authorization[0], req.body.project_id);

    const transferCodeObj = await neonIntegrationProjectTransferCodeHandler.createCode({
      tenancy: await getSoleTenancyFromProject(internalProject),
      method: {},
      data: {
        project_id: neonProvisionedProject.projectId,
        neon_client_id: neonProvisionedProject.neonClientId,
      },
      callbackUrl: new URL("/integrations/neon/projects/transfer/confirm", getEnvVariable("NEXT_PUBLIC_STACK_DASHBOARD_URL")),
      expiresInMs: 1000 * 60 * 60,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        confirmation_url: transferCodeObj.link.toString(),
      },
    };
  },
});
