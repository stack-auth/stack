import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler, deprecatedParseRequest } from "@/lib/route-handlers";
import { authorizationHeaderSchema, decodeAccessToken } from "@/lib/tokens";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { getUserTeams } from "@/lib/teams";


const getSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
  }),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: { authorization },
  } = await deprecatedParseRequest(req, getSchema);

  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
    },
  } = await deprecatedParseRequest(req, getSchema);

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new StatusError(StatusError.Forbidden);
  }

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(authorization.split(" ")[1]);

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.NotFound);
  }
  
  const teams = await getUserTeams(projectId, userId);

  return NextResponse.json(teams);
});

const postSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
  }),
  body: yup.object({
    displayName: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: { 
      authorization, 
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
    },
    body: { displayName },
  } = await deprecatedParseRequest(req, postSchema);

  if (!await checkApiKeySet(projectId, { publishableClientKey })) {
    throw new StatusError(StatusError.Forbidden);
  }

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(authorization.split(" ")[1]);

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.NotFound);
  }

  // const team = await createTeam(userId, { displayName });

  return NextResponse.json({});
});
