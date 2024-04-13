import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, createApiKeySet, listApiKeySets, superSecretAdminKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";

const getSchema = yup.object({
  headers: yup.object({
    "x-stack-super-secret-admin-key": superSecretAdminKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-super-secret-admin-key": superSecretAdminKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
  } = await deprecatedParseRequest(req, getSchema);

  if (!await checkApiKeySet(projectId, { superSecretAdminKey }) && !await isProjectAdmin(projectId, adminAccessToken)) {
    throw new StatusError(StatusError.Forbidden, "Invalid API key or insufficient permissions");
  }

  const apiKeys = await listApiKeySets(
    projectId,
  );

  return NextResponse.json(apiKeys);
});

const postSchema = yup.object({
  headers: yup.object({
    "x-stack-super-secret-admin-key": superSecretAdminKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    description: yup.string().required(),
    expiresAt: yup.date().required(),
    hasPublishableClientKey: yup.boolean().required(),
    hasSecretServerKey: yup.boolean().required(),
    hasSuperSecretAdminKey: yup.boolean().required(),
  }).required(),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-super-secret-admin-key": superSecretAdminKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    body: {
      description,
      expiresAt,
      hasPublishableClientKey,
      hasSecretServerKey,
      hasSuperSecretAdminKey,
    },
  } = await deprecatedParseRequest(req, postSchema);

  if (!await checkApiKeySet(projectId, { superSecretAdminKey }) && !await isProjectAdmin(projectId, adminAccessToken)) {
    throw new StatusError(StatusError.Forbidden, "Invalid API key");
  }

  const created = await createApiKeySet(
    projectId,
    description,
    expiresAt,
    !!hasPublishableClientKey,
    !!hasSecretServerKey,
    !!hasSuperSecretAdminKey,
  );

  return NextResponse.json(created);
});
