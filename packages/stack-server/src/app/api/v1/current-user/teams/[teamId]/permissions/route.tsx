import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { authorizationHeaderSchema, decodeAccessToken } from "@/lib/tokens";
import { checkApiKeySet, publishableClientKeyHeaderSchema, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { listUserServerTeams, listUserTeams } from "@/lib/teams";
import { ServerTeamJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { TeamJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { listUserDirectPermissions } from "@/lib/permissions";


const getSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true", "false"]).default("false"),
  }).required(),
  headers: yup.object({
    authorization: authorizationHeaderSchema.default(undefined),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string } }) => {
  const {
    query: {
      server,
    },
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
      "x-stack-secret-server-key": secretServerKey,
    },
  } = await deprecatedParseRequest(req, getSchema);

  if (!authorization) {
    return NextResponse.json(null);
  }

  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });
  const skValid = await checkApiKeySet(projectId, { secretServerKey });

  if (!pkValid && !skValid) {
    throw new StatusError(StatusError.Forbidden);
  }

  const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
  const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.NotFound);
  }

  if (server === "true") {
    if (!skValid) {
      throw new StatusError(StatusError.Forbidden, "Secret server key is invalid");
    }
  } else {
    if (!pkValid) {
      throw new StatusError(StatusError.Forbidden, "Publishable client key is invalid");
    }
  }

  return NextResponse.json(await listUserDirectPermissions({
    projectId, 
    teamId: options.params.teamId, 
    userId,
    type: "team"
  }));
});
