import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { addUserToTeam, getTeam, listUserTeams, removeUserFromTeam } from "@/lib/teams";
import { getClientUser } from "@/lib/users";
import { isProjectAdmin } from "@/lib/projects";
import { updateTeamMemberDirectPermissions } from "@/lib/permissions";

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

    await addUserToTeam(projectId, options.params.teamId, options.params.userId);
  }

  return NextResponse.json(null);
});

const putSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    directPermissionIds: yup.array(yup.string().required()).required(),
  }).required(),
});

export const PUT = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    query: { server },
    body,
  } = await deprecatedParseRequest(req, putSchema);

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

    await updateTeamMemberDirectPermissions(
      projectId, 
      options.params.teamId, 
      options.params.userId,
      { type: "any-team" },
      body.directPermissionIds
    );
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

  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    await removeUserFromTeam(projectId, options.params.teamId, options.params.userId);
  }

  return NextResponse.json(null);
});