import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { authorizationHeaderSchema } from "@/lib/tokens";
import { addUserToTeam, getTeam, getUserTeams } from "@/lib/teams";
import { getClientUser } from "@/lib/users";

const postSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true", "false"]).default("false"),
  }).required(),
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }),
  body: yup.object({
    userId: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
    },
    query: { server },
    body: { userId },
  } = await deprecatedParseRequest(req, postSchema);

  if (!server) {
    throw new StatusError(StatusError.BadRequest, "Not impelemented");
  }

  if (!(await checkApiKeySet(projectId, { secretServerKey }))) {
    throw new StatusError(StatusError.Forbidden);
  }

  const team = await getTeam(projectId, options.params.teamId);
  if (!team) {
    throw new StatusError(StatusError.NotFound, "Team not found");
  }

  const user = await getClientUser(projectId, userId);
  if (!user) {
    throw new StatusError(StatusError.NotFound, "User not found");
  }

  const userTeams = await getUserTeams(projectId, userId);
  if (userTeams.some(t => t.id === options.params.teamId)) {
    throw new StatusError(StatusError.BadRequest, "User is already in the team");
  }

  await addUserToTeam(projectId, options.params.teamId, userId);

  return NextResponse.json({});
});
