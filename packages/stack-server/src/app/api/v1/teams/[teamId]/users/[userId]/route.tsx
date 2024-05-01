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
  }).required(),
  body: yup.object({
    permissions: yup.array(yup.string().required()).nullable(),
  }).nullable(),
});

const handler = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
  const {
    method,
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
    },
    body
  } = await deprecatedParseRequest(req, getSchema);

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new StatusError(StatusError.Forbidden);
  }

  const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
  const { userId: currentUserId, projectId: accessTokenProjectId } = decodedAccessToken;

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.NotFound);
  }

  // if (!hasPermission(currentUserId, projectId, teamId, Permission.ReadTeamUsers)) {
  //   throw new StatusError(StatusError.Forbidden);
  // }

  // if (body && !hasPermission(currentUserId, projectId, teamId, Permission.UpdateTeamUserPermissions)) {
  //   throw new StatusError(StatusError.Forbidden);
  // }
  
  // await updateTeamUserPermissions(currentUserId, projectId, teamId, userId, body);
  return NextResponse.json({});
});

export const GET = handler;
export const PUT = handler;


const deleteSchema = yup.object({
  method: yup.string().oneOf(["DELETE"]).required(),
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const DELETE = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
  const {
    method,
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
    },
  } = await deprecatedParseRequest(req, deleteSchema);

  if (!authorization) {
    return NextResponse.json(null);
  }

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new StatusError(StatusError.Forbidden);
  }

  const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
  const { userId: currentUserId, projectId: accessTokenProjectId } = decodedAccessToken;

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.NotFound);
  }

  // if (userId !== currentUserId && !hasPermission(currentUserId, projectId, teamId, Permission.RemoveTeamUser)) {
  //   throw new StatusError(StatusError.Forbidden);
  // }
  
  // await removeUserFromTeam(projectId, teamId, userId);
  return NextResponse.json({});
});