import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/tokens";

const getSchema = yup.object({
  method: yup.string().oneOf(["GET", "PUT"]).required(),
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
    "x-stack-organization-id": yup.string().required(),
  }).required(),
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
  } = await deprecatedParseRequest(req, getSchema);

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

  // if (!hasPermission(userId, projectId, organizationId, Permission.listOrganizationUsers)) {
  //   throw new StatusError(StatusError.Forbidden);
  // }
  
  // await listOrganizationUsers(userId, projectId, organizationId);
  return NextResponse.json({});
});