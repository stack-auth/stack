import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { parseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";
import { listServerUsers } from "@/lib/users";

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
  } = await parseRequest(req, getSchema);

  let users;
  if (server === "true") {
    if (!await checkApiKeySet(projectId, { secretServerKey }) && !await isProjectAdmin(projectId, adminAccessToken)) {
      throw new StatusError(StatusError.Forbidden);
    }
    users = await listServerUsers(
      projectId,
    );
  }

  return NextResponse.json(users);
});
