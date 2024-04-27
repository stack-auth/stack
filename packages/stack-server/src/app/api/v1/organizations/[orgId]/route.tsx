import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/tokens";

const putOrGetSchema = yup.object({
  method: yup.string().oneOf(["GET", "PUT"]).required(),
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
    "x-stack-organization-id": yup.string().required(),
  }).required(),
  body: yup.object({
    displayName: yup.string().nullable(),
  }).nullable(),
});

const handler = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    method,
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
      "x-stack-organization-id": organizationId,
    },
    body,
  } = await deprecatedParseRequest(req, putOrGetSchema);

  let {
    displayName,
  } = body ?? {};

  if (!authorization) {
    return NextResponse.json(null);
  }

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new StatusError(StatusError.Forbidden);
  }

  const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
  const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.NotFound);
  }

  // if (!hasPermission(userId, projectId, organizationId, Permission.UpdateOrganization)) {
  //   throw new StatusError(StatusError.Forbidden);
  // }
  
  // await updateOrganization(userId, projectId, organizationId, { displayName });
  return NextResponse.json({});
});
export const GET = handler;
export const PUT = handler;

const deleteSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
    "x-stack-organization-id": yup.string().required(),
  }),
});

export const DELETE = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
      "x-stack-organization-id": organizationId,
    },
  } = await deprecatedParseRequest(req, deleteSchema);

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new StatusError(StatusError.Forbidden);
  }

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(authorization.split(" ")[1]);

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.NotFound);
  }

  // if (!hasPermission(userId, projectId, organizationId, Permission.DeleteOrganization)) {
  //   throw new StatusError(StatusError.Forbidden);
  // }

  // await deleteOrganization(userId, projectId, organizationId);
  return NextResponse.json({});
});