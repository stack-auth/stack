import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";
import { addUserToTeam, createServerTeam } from "@/lib/teams";
import { getServerUser } from "@/lib/users";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const postSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    displayName: yup.string().required(),
  }).required(),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { userId: string } }) => {
  const {
    query: {
      server,
    },
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    body,
  } = await deprecatedParseRequest(req, postSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  // eslint-disable-next-line
  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    const user = await getServerUser(projectId, options.params.userId);
    if (!user) {
      throw new StatusError(StatusError.NotFound, "User not found");
    }

    const team = await createServerTeam(projectId, body);
    await addUserToTeam({ projectId, teamId: team.id, userId: options.params.userId });
  }

  return NextResponse.json(null);
});
