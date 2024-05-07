import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { authorizationHeaderSchema, decodeAccessToken } from "@/lib/tokens";
import { checkApiKeySet, publishableClientKeyHeaderSchema, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { listUserPermissionDefinitionsRecursive } from "@/lib/permissions";
import { listServerTeamMembers } from "@/lib/teams";


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

  const users = await listServerTeamMembers(projectId, options.params.teamId);
  if (!users.some((user) => user.userId === userId)) {
    return NextResponse.json([]);
  }

  return NextResponse.json(await listUserPermissionDefinitionsRecursive({
    projectId, 
    teamId: options.params.teamId, 
    userId,
    type: "team"
  }));
});
