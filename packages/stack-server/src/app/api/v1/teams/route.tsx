import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, publishableClientKeyHeaderSchema, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";
import { addUserToTeam, createServerTeam, listServerTeams } from "@/lib/teams";
import { ServerTeamJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { KnownErrors } from "@stackframe/stack-shared";
import { authorizationHeaderSchema, decodeAccessToken } from "@/lib/tokens";

const getSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true", "false"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    query: {
      server,
    },
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
  } = await deprecatedParseRequest(req, getSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  let teams: ServerTeamJson[] = [];
  // eslint-disable-next-line
  if (server === "true") {
    if (!skValid && !asValid) {
      throw new KnownErrors.ApiKeyNotFound();
    }
    teams = await listServerTeams(projectId);
  } 
  return NextResponse.json(teams);
});

const postSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    authorization: authorizationHeaderSchema.optional(),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    displayName: yup.string().required(),
  }).required(),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    query: {
      server,
    },
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
      "x-stack-publishable-client-key": publishableClientKey,
      authorization,
    },
    body,
  } = await deprecatedParseRequest(req, postSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);
  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });

  // eslint-disable-next-line
  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    const team = await createServerTeam(projectId, body);
    return NextResponse.json(team);
  } else {
    if (!pkValid || !authorization) {
      throw new StatusError(StatusError.Forbidden);
    }

    const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
    const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

    if (accessTokenProjectId !== projectId) {
      throw new StatusError(StatusError.Forbidden);
    }

    const team = await createServerTeam(projectId, body);
    await addUserToTeam({ projectId, teamId: team.id, userId });
  }

  return NextResponse.json(null);
});
