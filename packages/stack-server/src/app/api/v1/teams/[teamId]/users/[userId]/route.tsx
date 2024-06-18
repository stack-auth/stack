import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { addUserToTeam, getTeam, grantDefaultTeamMemberPermissions, listUserTeams, removeUserFromTeam } from "@/lib/teams";
import { getClientUser } from "@/lib/users";
import { isProjectAdmin } from "@/lib/projects";

const postSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    query: { server },
  } = await deprecatedParseRequest(req, postSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  // eslint-disable-next-line
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
    if (userTeams.some(t => t.id === options.params.teamId)) {
      throw new StatusError(StatusError.BadRequest, "User is already in the team");
    }

    await addUserToTeam({ projectId, teamId: options.params.teamId, userId: options.params.userId });
    await grantDefaultTeamMemberPermissions({ projectId, teamId: options.params.teamId, userId: options.params.userId });
  }

  return NextResponse.json(null);
});


const deleteSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const DELETE = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
  const {
    query: {
      server,
    },
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
  } = await deprecatedParseRequest(req, deleteSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  // eslint-disable-next-line
  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    await removeUserFromTeam({ projectId, teamId: options.params.teamId, userId: options.params.userId });
  }

  return NextResponse.json(null);
});
