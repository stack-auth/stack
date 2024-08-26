import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";
import { listServerTeamMembers } from "@/lib/teams";
import { ServerTeamMemberJson } from "@/temporary-types";

const getSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string } }) => {
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

  let members: ServerTeamMemberJson[] = [];
  // eslint-disable-next-line
  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }
    members = await listServerTeamMembers(projectId, options.params.teamId);
  }

  return NextResponse.json(members);
});
