import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";
import { deleteServerUser, updateServerUser } from "@/lib/users";

const putOrGetOrDeleteSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).default(undefined),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    displayName: yup.string().nullable().default(undefined),
    primaryEmail: yup.string().email().nullable().default(undefined),
    primaryEmailVerified: yup.boolean().default(undefined),
    clientMetadata: yup.mixed().default(undefined),
    serverMetadata: yup.mixed().default(undefined),
  }).nullable(),
});

const handler = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { userId: string } }) => {
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
  } = await deprecatedParseRequest(req, putOrGetOrDeleteSchema);

  let {
    displayName,
    primaryEmail,
    primaryEmailVerified,
    clientMetadata,
    serverMetadata,
  } = body ?? {};

  try {
    if (clientMetadata !== undefined) clientMetadata = JSON.parse(JSON.stringify(clientMetadata));
    if (serverMetadata !== undefined) serverMetadata = JSON.parse(JSON.stringify(serverMetadata));
  } catch (e) {
    throw new StatusError(StatusError.BadRequest);
  }

  const userId = options.params.userId;

  let user;
  if (server === "true") {
    if (!await checkApiKeySet(projectId, { secretServerKey }) && !await isProjectAdmin(projectId, adminAccessToken)) {
      throw new StatusError(StatusError.Forbidden);
    }

    if (req.method === "DELETE") {
      await deleteServerUser(projectId, userId);
      user = null;
    } else {
      user = await updateServerUser(
        projectId,
        userId,
        {
          displayName,
          primaryEmail,
          primaryEmailVerified,
          clientMetadata,
          serverMetadata,
        },
      );
    }
  }

  return NextResponse.json(user);
});
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
