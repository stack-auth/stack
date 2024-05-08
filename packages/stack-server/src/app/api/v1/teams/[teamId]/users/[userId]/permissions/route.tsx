import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { getTeam, listUserTeams } from "@/lib/teams";
import { getClientUser } from "@/lib/users";
import { isProjectAdmin } from "@/lib/projects";
import { listUserDirectPermissions, listUserPermissionDefinitionsRecursive } from "@/lib/permissions";

const getSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
    direct: yup.string().oneOf(["true", "false"]).default("false"),
    type: yup.string().oneOf(["team"]).required(), // add global later
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    query: { server, direct, type },
  } = await deprecatedParseRequest(req, getSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    const team = await getTeam(projectId, options.params.teamId);
    if (!team) {
      throw new StatusError(StatusError.NotFound, "Team not found");
    }

    const user = await getClientUser(projectId, options.params.userId);
    if (!user) {
      throw new StatusError(StatusError.NotFound, "User not found");
    }

    const userTeams = await listUserTeams(projectId, options.params.userId);
    if (!userTeams.some(t => t.id === options.params.teamId)) {
      throw new StatusError(StatusError.BadRequest, "User is not in the team");
    }

    if (direct === 'true') {
      return NextResponse.json(await listUserDirectPermissions({
        projectId, 
        teamId: options.params.teamId, 
        userId: options.params.userId,
        type
      }));
    } else {
      return NextResponse.json(await listUserPermissionDefinitionsRecursive({
        projectId, 
        teamId: options.params.teamId, 
        userId: options.params.userId,
        type
      }));
    }
  }

  return NextResponse.json(null);
});
