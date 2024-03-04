import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { parseRequest, smartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";
import { updateClientUser, updateServerUser } from "@/lib/users";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/access-token";

const putOrGetSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true", "false"]).default("false"),
  }).required(),
  headers: yup.object({
    authorization: authorizationHeaderSchema.nullable().default(null),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    displayName: yup.string().nullable(),
    primaryEmail: yup.string().email().nullable(),
    primaryEmailVerified: yup.boolean().default(false),
    clientMetadata: yup.mixed().default(undefined),
    serverMetadata: yup.mixed().default(undefined),
  }).nullable(),
});

const handler = smartRouteHandler(async (req: NextRequest) => {
  const {
    query: {
      server,
    },
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    body,
  } = await parseRequest(req, putOrGetSchema);

  let {
    displayName,
    primaryEmail,
    primaryEmailVerified,
    clientMetadata,
    serverMetadata,
  } = body ?? {};

  if (!authorization) {
    return NextResponse.json(null);
  }

  try {
    if (clientMetadata !== undefined) clientMetadata = JSON.parse(JSON.stringify(clientMetadata));
    if (serverMetadata !== undefined) serverMetadata = JSON.parse(JSON.stringify(serverMetadata));
  } catch (e) {
    throw new StatusError(StatusError.BadRequest);
  }

  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });
  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  if (!pkValid && !skValid && !asValid) {
    throw new StatusError(StatusError.Forbidden);
  }

  const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
  const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.Forbidden);
  }

  let user;
  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }
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
  } else {
    if (!pkValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    user = await updateClientUser(
      projectId,
      userId,
      {
        displayName,
        clientMetadata,
      },
    );
  }

  return NextResponse.json(user);
});
export const GET = handler;
export const PUT = handler;
